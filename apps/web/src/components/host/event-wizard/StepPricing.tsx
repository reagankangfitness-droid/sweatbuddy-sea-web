'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useFormContext } from 'react-hook-form'
import { DollarSign, Users, X, Loader2 } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import type { EventFormData } from '@/lib/validations/event'

interface StepPricingProps {
  mode: 'create' | 'edit'
  currentAttendees?: number
}

export function StepPricing({ mode, currentAttendees }: StepPricingProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<EventFormData>()
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const isFree = watch('isFree')
  const price = watch('price')
  const paynowQrCode = watch('paynowQrCode')
  const maxSpots = watch('maxSpots')
  const isFull = watch('isFull')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Pricing & Capacity</h2>

      {/* Pricing Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Pricing</h4>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setValue('isFree', true)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              isFree
                ? 'bg-neutral-950 text-neutral-100'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => setValue('isFree', false)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              !isFree
                ? 'bg-neutral-950 text-neutral-100'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            Paid
          </button>
        </div>

        {!isFree && (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="number"
                {...register('price')}
                min="1"
                step="0.01"
                placeholder="Price (SGD)"
                className={`w-full pl-10 pr-4 py-2.5 bg-neutral-800 border rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm ${
                  errors.price ? 'border-red-500' : 'border-neutral-700'
                }`}
              />
            </div>
            {errors.price && (
              <p className="text-red-400 text-sm">{errors.price.message}</p>
            )}

            {/* PayNow QR Upload (create mode only) */}
            {mode === 'create' && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">PayNow QR Code</p>
                {paynowQrCode ? (
                  <div className="relative w-32 h-32 bg-neutral-950 rounded-lg overflow-hidden">
                    <Image
                      src={paynowQrCode}
                      alt="PayNow QR"
                      fill
                      className="object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setValue('paynowQrCode', '')}
                      className="absolute top-1 right-1 p-1 bg-neutral-900/80 rounded-full"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32">
                    {isUploadingQr ? (
                      <div className="h-32 flex items-center justify-center bg-neutral-800 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="eventImage"
                        onUploadBegin={() => { setIsUploadingQr(true); setUploadError('') }}
                        onClientUploadComplete={(res) => {
                          setIsUploadingQr(false)
                          if (res?.[0]?.url) {
                            setValue('paynowQrCode', res[0].url)
                          }
                        }}
                        onUploadError={() => {
                          setIsUploadingQr(false)
                          setUploadError('Failed to upload QR code')
                        }}
                        appearance={{
                          button: "bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-3 py-2 rounded-lg",
                          allowedContent: "hidden",
                        }}
                      />
                    )}
                    {uploadError && (
                      <p className="text-red-400 text-xs mt-1">{uploadError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              {...register('paynowNumber')}
              placeholder="PayNow number (optional)"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm"
            />
          </div>
        )}
      </div>

      {/* Capacity Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Capacity</h4>

        {/* Current attendees info (edit mode) */}
        {mode === 'edit' && currentAttendees !== undefined && (
          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
            <p className="text-sm text-neutral-400">
              <span className="font-semibold text-white">{currentAttendees}</span> people registered
              {maxSpots && (
                <span> / {maxSpots} spots</span>
              )}
            </p>
          </div>
        )}

        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="number"
            {...register('maxSpots')}
            min="1"
            placeholder="Max attendees (leave empty for unlimited)"
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm"
          />
        </div>
        <p className="text-xs text-neutral-500">Leave empty for unlimited spots</p>

        {/* Close Registration Toggle (edit mode only) */}
        {mode === 'edit' && (
          <>
            <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800">
              <div>
                <p className="font-medium text-white">Close registration</p>
                <p className="text-sm text-neutral-500">Manually stop accepting new signups</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('isFull', !isFull)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  isFull ? 'bg-red-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-neutral-950 rounded-full shadow transition-transform ${
                    isFull ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {isFull && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                Registration is closed. New signups will be blocked.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
