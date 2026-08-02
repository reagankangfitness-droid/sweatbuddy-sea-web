'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import { Loader2, RefreshCw } from 'lucide-react'
import { getActivityEmoji } from '@/lib/activity-types'

const DEFAULT_STYLE_URL =
  process.env.NEXT_PUBLIC_OPENFREEMAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/fiord'

const CITY_FALLBACKS = {
  singapore: { lat: 1.3521, lng: 103.8198 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
}

export interface SessionVectorMapPin {
  id: string
  title: string
  kind?: 'session' | 'community' | 'place'
  markerVariant?: 'session' | 'community' | 'place' | 'featured-place'
  latitude?: number | null
  longitude?: number | null
  city?: string | null
  primaryLabel?: string
  priceLabel?: string
  activityLabel?: string
  previewTitle?: string
  previewSubtitle?: string
  previewMeta?: string
  previewImage?: string | null
  previewCtaLabel?: string
  href?: string
}

interface SessionVectorMapProps {
  center: { lat: number; lng: number }
  pins: SessionVectorMapPin[]
  selectedPinId?: string | null
  onPinClick?: (pin: SessionVectorMapPin | null) => void
  onMapClick?: () => void
  initialZoom?: number
  maxFitZoom?: number
  fitPadding?: number
  showControls?: boolean
  showEmptyState?: boolean
  className?: string
}

export function SessionVectorMap({
  center,
  pins,
  selectedPinId,
  onPinClick,
  onMapClick,
  initialZoom = 12,
  maxFitZoom = 13,
  fitPadding = 72,
  showControls = true,
  showEmptyState = true,
  className,
}: SessionVectorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const initialCenterRef = useRef(center)
  const onMapClickRef = useRef(onMapClick)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  const resolvedPins = useMemo(
    () =>
      spreadNearbyPins(pins
        .map((pin, index) => ({ pin, position: getPinPosition(pin, index) }))
        .filter((entry): entry is { pin: SessionVectorMapPin; position: { lat: number; lng: number } } =>
          Boolean(entry.position),
        )),
    [pins],
  )

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let loaded = false
    setReady(false)
    setFailed(false)

    let map: MapLibreMap
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: DEFAULT_STYLE_URL,
        center: [initialCenterRef.current.lng, initialCenterRef.current.lat],
        zoom: initialZoom,
        attributionControl: false,
        cooperativeGestures: false,
      })
    } catch {
      setFailed(true)
      return
    }

    mapRef.current = map
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    if (showControls) {
      map.addControl(new NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right')
    }

    const handleLoad = () => setReady(true)
    const handleInitialLoad = () => {
      applySweatBuddiesMapTone(map)
      loaded = true
      handleLoad()
    }
    const handleClick = () => onMapClickRef.current?.()
    const failTimer = window.setTimeout(() => {
      if (!loaded) setFailed(true)
    }, 9000)

    map.on('load', handleInitialLoad)
    map.on('click', handleClick)

    return () => {
      window.clearTimeout(failTimer)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.off('load', handleInitialLoad)
      map.off('click', handleClick)
      map.remove()
      mapRef.current = null
    }
  }, [initialZoom, loadAttempt, showControls])

  function retryMapLoad() {
    setReady(false)
    setFailed(false)
    setLoadAttempt((attempt) => attempt + 1)
  }

  useEffect(() => {
    if (!ready || !mapRef.current) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    for (const { pin, position } of resolvedPins) {
      const element = document.createElement(pin.href ? 'a' : 'button')
      element.className = getMarkerClassName(pin, selectedPinId === pin.id)
      element.setAttribute('aria-label', pin.title)
      element.innerHTML = markerHtml(pin)

      if (pin.href) {
        element.setAttribute('href', pin.href)
      } else {
        element.setAttribute('type', 'button')
      }

      element.addEventListener('click', (event) => {
        event.stopPropagation()
        if (!pin.href) {
          event.preventDefault()
        }
        onPinClick?.(selectedPinId === pin.id ? null : pin)
      })

      const marker = new Marker({
        element,
        anchor: 'bottom',
        offset: [0, -4],
      })
        .setLngLat([position.lng, position.lat])
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    }
  }, [onPinClick, ready, resolvedPins, selectedPinId])

  useEffect(() => {
    if (!ready || !mapRef.current) return

    if (resolvedPins.length === 0) {
      mapRef.current.easeTo({ center: [center.lng, center.lat], zoom: initialZoom, duration: 500 })
      return
    }

    const bounds = new LngLatBounds()
    for (const { position } of resolvedPins) {
      bounds.extend([position.lng, position.lat])
    }

    if (resolvedPins.length === 1) {
      mapRef.current.easeTo({
        center: [resolvedPins[0].position.lng, resolvedPins[0].position.lat],
        zoom: Math.min(maxFitZoom, 13),
        duration: 500,
      })
      return
    }

    mapRef.current.fitBounds(bounds, {
      padding: fitPadding,
      maxZoom: maxFitZoom,
      duration: 600,
    })
  }, [center.lat, center.lng, fitPadding, initialZoom, maxFitZoom, ready, resolvedPins])

  if (failed) {
    return (
      <StaticPinMapFallback
        className={className}
        pins={resolvedPins}
        selectedPinId={selectedPinId}
        onPinClick={onPinClick}
        onRetry={retryMapLoad}
        showEmptyState={showEmptyState}
      />
    )
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#F4EFE3] ${className ?? ''}`}>
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#F4EFE3]">
          <Loader2 className="h-6 w-6 animate-spin text-[#17130E]/50" />
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-[#17130E]/46">Loading live map</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,239,227,0.06),rgba(244,239,227,0.2))]" />
    </div>
  )
}

function StaticPinMapFallback({
  className,
  pins,
  selectedPinId,
  onPinClick,
  onRetry,
  showEmptyState,
}: {
  className?: string
  pins: Array<{ pin: SessionVectorMapPin; position: { lat: number; lng: number } }>
  selectedPinId?: string | null
  onPinClick?: (pin: SessionVectorMapPin | null) => void
  onRetry: () => void
  showEmptyState: boolean
}) {
  const bounds = getStaticBounds(pins.map((entry) => entry.position))
  const activityPinCount = pins.filter((entry) => entry.pin.kind !== 'place').length
  const projectedPins = spreadStaticMarkerPoints(
    pins.map((entry) => ({
      ...entry,
      point: projectStaticPoint(entry.position, bounds),
    })),
  )

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#F4EFE3] ${className ?? ''}`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#F4EFE3,#EFE8D8)]" />
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(24deg,transparent_0_42%,rgba(23,19,14,0.10)_42.3%,transparent_43.2%),linear-gradient(112deg,transparent_0_45%,rgba(23,19,14,0.07)_45.3%,transparent_46.1%),linear-gradient(154deg,transparent_0_50%,rgba(23,19,14,0.055)_50.2%,transparent_50.9%),linear-gradient(90deg,rgba(23,19,14,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(23,19,14,0.04)_1px,transparent_1px)] [background-size:360px_240px,430px_280px,520px_320px,96px_96px,96px_96px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_64%,rgba(216,227,228,0.62),transparent_22%),radial-gradient(circle_at_58%_34%,rgba(224,231,213,0.52),transparent_18%),radial-gradient(circle_at_44%_88%,rgba(216,227,228,0.58),transparent_20%)]" />
      <div className="absolute inset-x-3 top-3 z-[4] flex items-start justify-between gap-2">
        <div className="pointer-events-none min-w-0 rounded-md border border-[#17130E] bg-[#F8F4EA]/90 px-2.5 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#17130E]/72 backdrop-blur min-[380px]:px-3 min-[380px]:text-[11px]">
          <span className="block truncate">
            {activityPinCount > 0
              ? `${activityPinCount} active plan${activityPinCount === 1 ? '' : 's'}`
              : 'Activity map'}
          </span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry map"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#17130E] bg-[#F8F4EA]/90 font-mono text-[10px] font-black uppercase tracking-wide text-[#17130E]/72 backdrop-blur transition-colors hover:border-[#E8412C] hover:text-[#E8412C] sm:w-auto sm:px-4 sm:text-[11px]"
        >
          <RefreshCw className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Retry map</span>
        </button>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <span className="absolute left-[13%] top-[28%] font-mono text-[10px] font-black uppercase tracking-widest text-[#17130E]/22">
          North
        </span>
        <span className="absolute left-[49%] top-[47%] font-mono text-[10px] font-black uppercase tracking-widest text-[#17130E]/24">
          Central
        </span>
        <span className="absolute right-[14%] top-[35%] font-mono text-[10px] font-black uppercase tracking-widest text-[#17130E]/22">
          East
        </span>
        <span className="absolute bottom-[14%] right-[21%] font-mono text-[10px] font-black uppercase tracking-widest text-[#17130E]/20">
          Waterfront
        </span>
      </div>

      {pins.length === 0 && showEmptyState ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#17130E]">No mapped sessions</p>
            <p className="mt-2 text-xs font-semibold text-[#17130E]/50">Sessions still appear in the list.</p>
          </div>
        </div>
      ) : (
        projectedPins.map(({ pin, point }) => {
          const content = (
            <span
              className={getMarkerClassName(pin, selectedPinId === pin.id)}
              dangerouslySetInnerHTML={{ __html: markerHtml(pin) }}
            />
          )

          if (pin.href) {
            return (
              <a
                key={pin.id}
                href={pin.href}
                aria-label={pin.title}
                className="absolute z-[3] -translate-x-1/2 -translate-y-full"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={() => onPinClick?.(pin)}
              >
                {content}
              </a>
            )
          }

          return (
            <button
              key={pin.id}
              type="button"
              aria-label={pin.title}
              className="absolute z-[3] -translate-x-1/2 -translate-y-full"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onPinClick?.(selectedPinId === pin.id ? null : pin)}
            >
              {content}
            </button>
          )
        })
      )}
    </div>
  )
}

function getStaticBounds(points: Array<{ lat: number; lng: number }>) {
  if (points.length === 0) {
    return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 }
  }

  let minLat = Math.min(...points.map((point) => point.lat))
  let maxLat = Math.max(...points.map((point) => point.lat))
  let minLng = Math.min(...points.map((point) => point.lng))
  let maxLng = Math.max(...points.map((point) => point.lng))

  if (minLat === maxLat) {
    minLat -= 0.01
    maxLat += 0.01
  }
  if (minLng === maxLng) {
    minLng -= 0.01
    maxLng += 0.01
  }

  return { minLat, maxLat, minLng, maxLng }
}

function projectStaticPoint(
  point: { lat: number; lng: number },
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
) {
  const padding = 20
  const x = padding + ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (100 - padding * 2)
  const y = padding + ((bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat)) * (100 - padding * 2)

  return {
    x: Math.max(padding, Math.min(100 - padding, x)),
    y: Math.max(padding, Math.min(100 - padding, y)),
  }
}

function spreadStaticMarkerPoints<T extends { point: { x: number; y: number } }>(entries: T[]) {
  const bucketSize = 28
  const bucketed = new Map<string, T[]>()

  entries.forEach((entry) => {
    const bucket = `${Math.round(entry.point.x / bucketSize)}:${Math.round(entry.point.y / bucketSize)}`
    const existing = bucketed.get(bucket) ?? []
    existing.push(entry)
    bucketed.set(bucket, existing)
  })

  const spreadEntries = entries.map((entry) => {
    const bucket = `${Math.round(entry.point.x / bucketSize)}:${Math.round(entry.point.y / bucketSize)}`
    const group = bucketed.get(bucket)
    if (!group || group.length <= 1) return entry

    const index = group.indexOf(entry)
    const offsets = getStaticClusterOffsets(group.length)
    const offset = offsets[index % offsets.length]

    return {
      ...entry,
      point: {
        x: Math.max(10, Math.min(90, entry.point.x + offset.x)),
        y: Math.max(12, Math.min(80, entry.point.y + offset.y)),
      },
    }
  })

  return relaxStaticMarkerPoints(spreadEntries)
}

function getStaticClusterOffsets(size: number) {
  if (size === 2) {
    return [
      { x: -15, y: -10 },
      { x: 15, y: 10 },
    ]
  }

  if (size === 3) {
    return [
      { x: 0, y: -22 },
      { x: -20, y: 10 },
      { x: 20, y: 10 },
    ]
  }

  return [
    { x: 0, y: -24 },
    { x: -22, y: -8 },
    { x: 22, y: -8 },
    { x: -22, y: 18 },
    { x: 22, y: 18 },
    { x: 0, y: 8 },
  ]
}

function relaxStaticMarkerPoints<T extends { point: { x: number; y: number } }>(entries: T[]) {
  const minXGap = 12
  const minYGap = 12
  const relaxed = entries.map((entry) => ({
    ...entry,
    point: { ...entry.point },
  }))

  for (let iteration = 0; iteration < 8; iteration += 1) {
    for (let firstIndex = 0; firstIndex < relaxed.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < relaxed.length; secondIndex += 1) {
        const first = relaxed[firstIndex]
        const second = relaxed[secondIndex]
        const dx = second.point.x - first.point.x
        const dy = second.point.y - first.point.y
        const xOverlap = minXGap - Math.abs(dx)
        const yOverlap = minYGap - Math.abs(dy)

        if (xOverlap <= 0 || yOverlap <= 0) continue

        if (yOverlap <= xOverlap) {
          const direction = dy >= 0 ? 1 : -1
          const adjustment = yOverlap / 2 + 1
          first.point.y = clampStaticY(first.point.y - direction * adjustment)
          second.point.y = clampStaticY(second.point.y + direction * adjustment)
        } else {
          const direction = dx >= 0 ? 1 : -1
          const adjustment = xOverlap / 2 + 1
          first.point.x = clampStaticX(first.point.x - direction * adjustment)
          second.point.x = clampStaticX(second.point.x + direction * adjustment)
        }
      }
    }
  }

  return relaxed
}

function clampStaticX(value: number) {
  return Math.max(10, Math.min(90, value))
}

function clampStaticY(value: number) {
  return Math.max(12, Math.min(80, value))
}

function spreadNearbyPins(
  pins: Array<{ pin: SessionVectorMapPin; position: { lat: number; lng: number } }>,
) {
  const bucketed = new Map<string, Array<{ pin: SessionVectorMapPin; position: { lat: number; lng: number } }>>()

  pins.forEach((entry) => {
    const bucket = `${entry.position.lat.toFixed(3)}:${entry.position.lng.toFixed(3)}`
    const existing = bucketed.get(bucket) ?? []
    existing.push(entry)
    bucketed.set(bucket, existing)
  })

  return pins.map((entry) => {
    const bucket = `${entry.position.lat.toFixed(3)}:${entry.position.lng.toFixed(3)}`
    const group = bucketed.get(bucket)
    if (!group || group.length <= 1) return entry

    const index = group.findIndex((candidate) => candidate.pin.id === entry.pin.id)
    const angle = (Math.PI * 2 * index) / group.length
    const radius = 0.0014 + Math.min(group.length, 6) * 0.00012

    return {
      ...entry,
      position: {
        lat: entry.position.lat + Math.sin(angle) * radius,
        lng: entry.position.lng + Math.cos(angle) * radius,
      },
    }
  })
}

function applySweatBuddiesMapTone(map: MapLibreMap) {
  const style = map.getStyle()

  for (const layer of style.layers ?? []) {
    const id = layer.id
    const normalizedId = id.toLowerCase()

    try {
      if (layer.type === 'background') {
        map.setPaintProperty(id, 'background-color', '#F4EFE3')
        continue
      }

      if (layer.type === 'fill') {
        const isWater = /water|river|stream|ocean|sea|lake/.test(normalizedId)
        const isGreenSpace = /park|wood|forest|grass|landuse|pitch|nature|cemetery/.test(normalizedId)
        map.setPaintProperty(id, 'fill-color', isWater ? '#D7E2E3' : isGreenSpace ? '#DCE5D1' : '#F0E9DC')
        map.setPaintProperty(id, 'fill-opacity', isWater ? 0.94 : isGreenSpace ? 0.78 : 0.9)
        continue
      }

      if (layer.type === 'line') {
        const isRoad = /road|street|bridge|tunnel|path|track|rail/.test(normalizedId)
        const isBoundary = /boundary|admin|border/.test(normalizedId)
        const isPath = /path|track|trail|foot|cycle|pedestrian|service|rail/.test(normalizedId)
        const isMajorRoad = /motorway|trunk|primary|secondary|tertiary|major|highway/.test(normalizedId)
        map.setPaintProperty(
          id,
          'line-color',
          isBoundary
            ? 'rgba(23,19,14,0.16)'
            : isRoad
              ? isMajorRoad
                ? 'rgba(23,19,14,0.24)'
                : isPath
                  ? 'rgba(23,19,14,0.08)'
                  : 'rgba(23,19,14,0.14)'
              : 'rgba(23,19,14,0.10)',
        )
        if (isRoad) {
          map.setPaintProperty(
            id,
            'line-opacity',
            isMajorRoad
              ? ['interpolate', ['linear'], ['zoom'], 8, 0.22, 10.5, 0.34, 13, 0.5]
              : isPath
                ? ['interpolate', ['linear'], ['zoom'], 8, 0.01, 11, 0.08, 14, 0.2]
                : ['interpolate', ['linear'], ['zoom'], 8, 0.04, 11, 0.16, 14, 0.3],
          )
          map.setPaintProperty(
            id,
            'line-width',
            isMajorRoad
              ? ['interpolate', ['linear'], ['zoom'], 8, 0.45, 11, 0.8, 14, 1.35]
              : isPath
                ? ['interpolate', ['linear'], ['zoom'], 10, 0.12, 13, 0.28, 15, 0.65]
                : ['interpolate', ['linear'], ['zoom'], 9, 0.2, 12, 0.45, 15, 0.9],
          )
        } else {
          map.setPaintProperty(id, 'line-opacity', isBoundary ? 0.26 : 0.22)
        }
        continue
      }

      if (layer.type === 'symbol') {
        map.setPaintProperty(id, 'text-color', '#686159')
        map.setPaintProperty(id, 'text-halo-color', '#F4EFE3')
        map.setPaintProperty(id, 'text-halo-width', 1.2)
        map.setPaintProperty(id, 'icon-color', '#8B847A')
        continue
      }

      if (layer.type === 'circle') {
        map.setPaintProperty(id, 'circle-color', '#8B847A')
        map.setPaintProperty(id, 'circle-opacity', 0.42)
        continue
      }

      if (layer.type === 'heatmap') {
        map.setPaintProperty(id, 'heatmap-color', [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0,0,0,0)',
          0.35,
          'rgba(23,19,14,0.04)',
          0.7,
          'rgba(11,75,168,0.08)',
          1,
          'rgba(232,65,44,0.12)',
        ])
        continue
      }

      if (layer.type === 'fill-extrusion') {
        map.setPaintProperty(id, 'fill-extrusion-color', '#E5DDCF')
        map.setPaintProperty(id, 'fill-extrusion-opacity', 0.34)
        continue
      }

      if (layer.type === 'raster') {
        map.setPaintProperty(id, 'raster-saturation', -0.9)
        map.setPaintProperty(id, 'raster-brightness-min', 0.72)
        map.setPaintProperty(id, 'raster-brightness-max', 1)
        map.setPaintProperty(id, 'raster-contrast', -0.08)
      }
    } catch {
      // Some source styles do not support every paint override on every layer.
    }
  }
}

function markerHtml(pin: SessionVectorMapPin) {
  const primary = escapeHtml(pin.primaryLabel ?? 'Session')
  const price = pin.priceLabel ? escapeHtml(pin.priceLabel) : null
  const emoji = escapeHtml(getMarkerEmoji(pin))
  const accent = `<span class="sb-map-marker__emoji" aria-hidden="true">${emoji}</span>`
  const preview = markerPreviewHtml(pin, emoji)

  if (!price) {
    return `${accent}<span class="sb-map-marker__single">${primary}</span>${preview}`
  }

  return `
    ${accent}
    <span class="sb-map-marker__price">${price}</span>
    ${preview}
  `
}

function getMarkerClassName(pin: SessionVectorMapPin, selected: boolean) {
  const variant = pin.markerVariant || pin.kind || 'session'
  return [
    'sb-map-marker',
    `sb-map-marker--${variant}`,
    selected ? 'is-selected' : '',
  ].filter(Boolean).join(' ')
}

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u

function markerPreviewHtml(pin: SessionVectorMapPin, emoji: string) {
  const title = escapeHtml(pin.previewTitle ?? pin.title)
  const subtitle = pin.previewSubtitle ? escapeHtml(pin.previewSubtitle) : null
  const meta = pin.previewMeta ? escapeHtml(pin.previewMeta) : null
  const activity = escapeHtml(pin.primaryLabel ?? pin.activityLabel ?? 'Session')
  const price = pin.priceLabel ? escapeHtml(pin.priceLabel) : null
  const cta = escapeHtml(pin.previewCtaLabel ?? (pin.href ? 'Open details' : 'View details'))
  const image = pin.previewImage
    ? `<span class="sb-map-marker-preview__media"><img src="${escapeHtml(pin.previewImage)}" alt="" loading="lazy" /></span>`
    : `<span class="sb-map-marker-preview__media sb-map-marker-preview__media--fallback">${emoji}</span>`

  return `
    <span class="sb-map-marker-preview" aria-hidden="true">
      ${image}
      <span class="sb-map-marker-preview__body">
        <span class="sb-map-marker-preview__eyebrow">
          <span>${activity}</span>
          ${price ? `<span>${price}</span>` : ''}
        </span>
        <span class="sb-map-marker-preview__title">${title}</span>
        ${subtitle ? `<span class="sb-map-marker-preview__subtitle">${subtitle}</span>` : ''}
        ${meta ? `<span class="sb-map-marker-preview__meta">${meta}</span>` : ''}
        <span class="sb-map-marker-preview__cta">${cta}</span>
      </span>
    </span>
  `
}

function getMarkerEmoji(pin: SessionVectorMapPin) {
  if (pin.activityLabel && EMOJI_PATTERN.test(pin.activityLabel)) return pin.activityLabel
  return getActivityEmoji(pin.primaryLabel ?? pin.activityLabel, '✦')
}

function getPinPosition(pin: SessionVectorMapPin, index: number): { lat: number; lng: number } | null {
  if (typeof pin.latitude === 'number' && typeof pin.longitude === 'number') {
    return { lat: pin.latitude, lng: pin.longitude }
  }

  const city = pin.city?.toLowerCase() ?? ''
  const base = city.includes('bangkok')
    ? CITY_FALLBACKS.bangkok
    : city.includes('singapore')
      ? CITY_FALLBACKS.singapore
      : null

  if (!base) return null

  const seed = pin.id.split('').reduce((hash, char) => hash + char.charCodeAt(0), index)
  const latJitter = (((seed * 17) % 100) - 50) / 5500
  const lngJitter = (((seed * 29) % 100) - 50) / 4200

  return {
    lat: base.lat + latJitter,
    lng: base.lng + lngJitter,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
