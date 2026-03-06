'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useFormContext } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ImageIcon,
  X,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  User,
  Instagram,
  Mail,
  ChevronDown,
} from 'lucide-react'
import { UploadButton, useUploadThing } from '@/lib/uploadthing'
import type { EventFormData } from '@/lib/validations/event'

interface StepReviewProps {
  mode: 'create' | 'edit'
  onSubmit: () => void
  isSubmitting: boolean
}

export function StepReview({ mode }: StepReviewProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<EventFormData>()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [organizerOpen, setOrganizerOpen] = useState(false)
  const dragCounter = useRef(0)

  const imageUrl = watch('imageUrl')
  const eventName = watch('eventName')
  const eventType = watch('eventType')
  const eventDate = watch('eventDate')
  const eventTime = watch('eventTime')
  const endTime = watch('endTime')
  const location = watch('location')
  const isFree = watch('isFree')
  const price = watch('price')
  const organizerName = watch('organizerName')
  const instagramHandle = watch('instagramHandle')
  const email = watch('email')

  const { startUpload } = useUploadThing('eventImage', {
    onClientUploadComplete: (res) => {
      setIsUploading(false)
      if (res?.[0]?.url) setValue('imageUrl', res[0].url)
    },
    onUploadError: (err) => {
      setIsUploading(false)
      setUploadError(`Upload failed: ${err.message}`)
    },
  })

  const formatTime12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(f => f.type.startsWith('image/'))

    if (imageFile) {
      setIsUploading(true)
      setUploadError('')
      await startUpload([imageFile])
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Review & Publish</h2>

      {/* Cover Image Upload */}
      <div
        className={`relative aspect-[16/9] bg-neutral-900 rounded-2xl overflow-hidden border-2 transition-colors ${
          isDragging
            ? 'border-neutral-700 border-dashed bg-neutral-800'
            : 'border-neutral-800'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Event preview"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                Recommended size: 1080 x 1350px
              </span>
              <button
                type="button"
                onClick={() => setValue('imageUrl', null)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 hover:bg-white text-neutral-900 text-sm rounded-full transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Change image
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-neutral-500" />
                <p className="text-neutral-500 text-sm">Uploading...</p>
              </>
            ) : isDragging ? (
              <>
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-white text-sm font-medium">Drop image here</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-neutral-500" />
                </div>
                <div className="text-center">
                  <p className="text-neutral-400 text-sm mb-1">Add cover image</p>
                  <p className="text-neutral-400 text-xs">Recommended: 1080 x 1350px</p>
                </div>
                <UploadButton
                  endpoint="eventImage"
                  onUploadBegin={() => { setIsUploading(true); setUploadError('') }}
                  onClientUploadComplete={(res) => {
                    setIsUploading(false)
                    if (res?.[0]?.url) setValue('imageUrl', res[0].url)
                  }}
                  onUploadError={(error: Error) => {
                    setIsUploading(false)
                    setUploadError(`Upload failed: ${error.message}`)
                  }}
                  appearance={{
                    button: "bg-neutral-950 hover:bg-neutral-800 text-neutral-100 font-medium px-5 py-2.5 rounded-full text-sm transition-colors",
                    allowedContent: "hidden",
                  }}
                />
                <p className="text-neutral-400 text-xs">or drag and drop</p>
              </>
            )}
          </div>
        )}
      </div>
      {uploadError && (
        <p className="text-red-400 text-sm">{uploadError}</p>
      )}

      {/* Preview Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            {eventType && (
              <span className="px-2.5 py-1 bg-neutral-800 rounded-full text-xs text-neutral-300">
                {eventType}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white">
            {eventName || 'Event Name'}
          </h3>

          <div className="space-y-2">
            {eventDate && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDateDisplay(eventDate)}
                  {eventTime && ` at ${formatTime12Hour(eventTime)}`}
                  {endTime && ` - ${formatTime12Hour(endTime)}`}
                </span>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span className={isFree ? 'text-green-400 font-medium' : 'text-white font-medium'}>
                {isFree ? 'FREE' : `$${price || '0'}`}
              </span>
            </div>
          </div>

          {organizerName && (
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-sm text-neutral-500">
                Hosted by <span className="text-neutral-300">{organizerName}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Organizer Info (create mode, collapsible) */}
      {mode === 'create' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setOrganizerOpen(!organizerOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <span className="font-medium">Organizer Info</span>
            <motion.div
              animate={{ rotate: organizerOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {organizerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3 bg-neutral-900 border border-neutral-700 rounded-xl">
                  <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">About You</h4>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      {...register('organizerName')}
                      placeholder="Your name *"
                      className={`w-full pl-10 pr-4 py-2.5 bg-neutral-800 border rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm ${errors.organizerName ? 'border-red-500' : 'border-neutral-700'}`}
                    />
                  </div>

                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      {...register('instagramHandle')}
                      placeholder="Instagram handle *"
                      className={`w-full pl-10 pr-4 py-2.5 bg-neutral-800 border rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm ${errors.instagramHandle ? 'border-red-500' : 'border-neutral-700'}`}
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="Email *"
                      className={`w-full pl-10 pr-4 py-2.5 bg-neutral-800 border rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm ${errors.email ? 'border-red-500' : 'border-neutral-700'}`}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
