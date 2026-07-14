'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import { Loader2 } from 'lucide-react'
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
      pins
        .map((pin, index) => ({ pin, position: getPinPosition(pin, index) }))
        .filter((entry): entry is { pin: SessionVectorMapPin; position: { lat: number; lng: number } } =>
          Boolean(entry.position),
        ),
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
      element.className = `sb-map-marker${selectedPinId === pin.id ? ' is-selected' : ''}`
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
      />
    )
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#161A18] ${className ?? ''}`}>
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#161A18]">
          <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-white/40">Loading live map</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,rgba(0,0,0,0.04)_62%,rgba(0,0,0,0.16)_100%)]" />
    </div>
  )
}

function StaticPinMapFallback({
  className,
  pins,
  selectedPinId,
  onPinClick,
  onRetry,
}: {
  className?: string
  pins: Array<{ pin: SessionVectorMapPin; position: { lat: number; lng: number } }>
  selectedPinId?: string | null
  onPinClick?: (pin: SessionVectorMapPin | null) => void
  onRetry: () => void
}) {
  const bounds = getStaticBounds(pins.map((entry) => entry.position))

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#1C211F] ${className ?? ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_12%,rgba(36,48,52,0.9),transparent_24%),radial-gradient(circle_at_78%_78%,rgba(34,43,47,0.82),transparent_28%),linear-gradient(135deg,rgba(25,31,29,0.96),rgba(28,36,32,0.96))]" />
      <div className="absolute inset-0 opacity-42 [background-image:linear-gradient(24deg,transparent_0_42%,rgba(239,246,236,0.10)_42.3%,transparent_43.2%),linear-gradient(112deg,transparent_0_45%,rgba(239,246,236,0.075)_45.3%,transparent_46.1%),linear-gradient(154deg,transparent_0_50%,rgba(239,246,236,0.055)_50.2%,transparent_50.9%),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:360px_240px,430px_280px,520px_320px,96px_96px,96px_96px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_64%,rgba(54,67,56,0.78),transparent_22%),radial-gradient(circle_at_58%_34%,rgba(45,57,48,0.56),transparent_18%),radial-gradient(circle_at_44%_88%,rgba(33,42,45,0.78),transparent_20%)]" />
      <div className="pointer-events-none absolute left-4 top-4 z-30 rounded-md border border-white/10 bg-black/45 px-3 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white/72 backdrop-blur">
        {pins.length > 0 ? `${pins.length} mapped listings` : 'Map preview'}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="absolute right-4 top-4 z-30 min-h-11 rounded-full border border-white/15 bg-black/40 px-4 font-mono text-[11px] font-black uppercase tracking-wide text-white/72 backdrop-blur transition-colors hover:border-[#63FF8F] hover:text-[#63FF8F]"
      >
        Retry map
      </button>
      <div className="pointer-events-none absolute inset-0 z-10">
        <span className="absolute left-[13%] top-[28%] font-mono text-[10px] font-black uppercase tracking-widest text-white/24">
          North
        </span>
        <span className="absolute left-[49%] top-[47%] font-mono text-[10px] font-black uppercase tracking-widest text-white/28">
          Central
        </span>
        <span className="absolute right-[14%] top-[35%] font-mono text-[10px] font-black uppercase tracking-widest text-white/24">
          East
        </span>
        <span className="absolute bottom-[14%] right-[21%] font-mono text-[10px] font-black uppercase tracking-widest text-white/22">
          Waterfront
        </span>
      </div>

      {pins.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-white">No mapped sessions</p>
            <p className="mt-2 text-xs font-semibold text-white/50">Sessions still appear in the list.</p>
          </div>
        </div>
      ) : (
        pins.map(({ pin, position }, index) => {
          const point = projectStaticPoint(position, bounds)
          const content = (
            <span
              className={`sb-map-marker${selectedPinId === pin.id ? ' is-selected' : ''}`}
              dangerouslySetInnerHTML={{ __html: markerHtml(pin) }}
            />
          )

          if (pin.href) {
            return (
              <a
                key={pin.id}
                href={pin.href}
                aria-label={pin.title}
                className="absolute z-20 -translate-x-1/2 -translate-y-full"
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
              className="absolute z-20 -translate-x-1/2 -translate-y-full"
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
  const padding = 12
  const x = padding + ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (100 - padding * 2)
  const y = padding + ((bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat)) * (100 - padding * 2)

  return {
    x: Math.max(padding, Math.min(100 - padding, x)),
    y: Math.max(padding, Math.min(100 - padding, y)),
  }
}

function applySweatBuddiesMapTone(map: MapLibreMap) {
  const style = map.getStyle()

  for (const layer of style.layers ?? []) {
    const id = layer.id
    const normalizedId = id.toLowerCase()

    try {
      if (layer.type === 'background') {
        map.setPaintProperty(id, 'background-color', '#151A17')
        continue
      }

      if (layer.type === 'fill') {
        const isWater = /water|river|stream|ocean|sea|lake/.test(normalizedId)
        const isGreenSpace = /park|wood|forest|grass|landuse|pitch|nature|cemetery/.test(normalizedId)
        map.setPaintProperty(id, 'fill-color', isWater ? '#222C2F' : isGreenSpace ? '#263126' : '#1D2420')
        map.setPaintProperty(id, 'fill-opacity', isWater ? 0.98 : 0.9)
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
            ? 'rgba(230,238,226,0.14)'
            : isRoad
              ? isMajorRoad
                ? 'rgba(235,244,232,0.22)'
                : isPath
                  ? 'rgba(235,244,232,0.08)'
                  : 'rgba(235,244,232,0.12)'
              : 'rgba(223,232,220,0.10)',
        )
        if (isRoad) {
          map.setPaintProperty(
            id,
            'line-opacity',
            isMajorRoad
              ? ['interpolate', ['linear'], ['zoom'], 8, 0.28, 10.5, 0.42, 13, 0.58]
              : isPath
                ? ['interpolate', ['linear'], ['zoom'], 8, 0.02, 11, 0.10, 14, 0.22]
                : ['interpolate', ['linear'], ['zoom'], 8, 0.06, 11, 0.20, 14, 0.36],
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
          map.setPaintProperty(id, 'line-opacity', isBoundary ? 0.34 : 0.32)
        }
        continue
      }

      if (layer.type === 'symbol') {
        map.setPaintProperty(id, 'text-color', '#C7CEC5')
        map.setPaintProperty(id, 'text-halo-color', '#101411')
        map.setPaintProperty(id, 'text-halo-width', 1.45)
        map.setPaintProperty(id, 'icon-color', '#A5AEA4')
        continue
      }

      if (layer.type === 'circle') {
        map.setPaintProperty(id, 'circle-color', '#A1ACA2')
        map.setPaintProperty(id, 'circle-opacity', 0.68)
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
          'rgba(255,255,255,0.08)',
          0.7,
          'rgba(99,255,143,0.14)',
          1,
          'rgba(99,255,143,0.24)',
        ])
        continue
      }

      if (layer.type === 'fill-extrusion') {
        map.setPaintProperty(id, 'fill-extrusion-color', '#252D27')
        map.setPaintProperty(id, 'fill-extrusion-opacity', 0.5)
        continue
      }

      if (layer.type === 'raster') {
        map.setPaintProperty(id, 'raster-saturation', -1)
        map.setPaintProperty(id, 'raster-brightness-min', 0.1)
        map.setPaintProperty(id, 'raster-brightness-max', 0.72)
        map.setPaintProperty(id, 'raster-contrast', 0.22)
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
