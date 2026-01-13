'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, Keyboard } from 'lucide-react'

interface QRScannerProps {
  onScan: (code: string) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export function QRScanner({ onScan, onError, disabled }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScannedRef = useRef<string>('')

  const startScanning = useCallback(async () => {
    if (!containerRef.current || scannerRef.current || disabled) return

    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Prevent duplicate scans
          if (decodedText === lastScannedRef.current) return
          lastScannedRef.current = decodedText

          // Extract check-in code from URL
          const match = decodedText.match(/\/checkin\/([a-zA-Z0-9_-]+)/)
          const code = match ? match[1] : decodedText

          // Vibrate on successful scan (if supported)
          if (navigator.vibrate) {
            navigator.vibrate(100)
          }

          onScan(code)

          // Reset after delay to allow same QR to be scanned again
          setTimeout(() => {
            lastScannedRef.current = ''
          }, 3000)
        },
        () => {
          // QR code not detected - ignore
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Scanner error:', err)
      setHasCamera(false)
      onError?.('Camera not available. Try manual entry.')
    }
  }, [onScan, onError, disabled])

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error('Stop scanner error:', err)
      }
      scannerRef.current = null
      setIsScanning(false)
    }
  }, [])

  useEffect(() => {
    if (!disabled && hasCamera && !showManualInput) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [startScanning, stopScanning, disabled, hasCamera, showManualInput])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode('')
    }
  }

  if (disabled) {
    return (
      <div className="bg-neutral-100 rounded-2xl p-8 text-center">
        <CameraOff className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-600">Scanner paused</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Camera Scanner */}
      {!showManualInput && hasCamera && (
        <div className="relative">
          <div
            id="qr-reader"
            ref={containerRef}
            className="rounded-2xl overflow-hidden bg-black"
            style={{ minHeight: 300 }}
          />

          {/* Scanning indicator */}
          {isScanning && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Scanning...
            </div>
          )}
        </div>
      )}

      {/* No Camera Fallback */}
      {!hasCamera && !showManualInput && (
        <div className="bg-neutral-100 rounded-2xl p-8 text-center">
          <CameraOff className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 mb-4">Camera not available</p>
          <button
            onClick={() => setShowManualInput(true)}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium"
          >
            Enter code manually
          </button>
        </div>
      )}

      {/* Toggle between camera and manual */}
      {hasCamera && (
        <button
          onClick={() => {
            if (showManualInput) {
              setShowManualInput(false)
            } else {
              stopScanning()
              setShowManualInput(true)
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          {showManualInput ? (
            <>
              <Camera className="w-4 h-4" />
              <span>Use camera instead</span>
            </>
          ) : (
            <>
              <Keyboard className="w-4 h-4" />
              <span>Enter code manually</span>
            </>
          )}
        </button>
      )}

      {/* Manual Code Entry */}
      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label htmlFor="manual-code" className="block text-sm font-medium text-neutral-700 mb-1">
              Check-in Code
            </label>
            <input
              id="manual-code"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter the code from ticket"
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check In
          </button>
        </form>
      )}
    </div>
  )
}
