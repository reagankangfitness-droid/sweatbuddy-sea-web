'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useUploadThing } from '@/lib/uploadthing'
import { toast } from 'sonner'
import {
  Camera,
  Upload,
  X,
  Check,
  Download,
  Share2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Flame,
  Calendar,
  Clock,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATES, type CardData, type TemplateConfig } from '@/lib/completion-cards'
import { CompletionCardTemplate } from '@prisma/client'

// =====================================================
// TYPES
// =====================================================

interface CompletionCardCreatorProps {
  userActivityId: string
  activityTitle: string
  activityImage?: string | null
  hostName: string
  hostAvatar?: string | null
  completedAt: Date
  durationMinutes?: number | null
  onComplete?: (cardId: string) => void
  onClose?: () => void
  open: boolean
}

type Step = 'upload' | 'customize' | 'preview'

// =====================================================
// MAIN COMPONENT
// =====================================================

export function CompletionCardCreator({
  userActivityId,
  activityTitle,
  activityImage,
  hostName,
  hostAvatar,
  completedAt,
  durationMinutes,
  onComplete,
  onClose,
  open,
}: CompletionCardCreatorProps) {
  // Step management
  const [step, setStep] = useState<Step>('upload')

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Card state
  const [card, setCard] = useState<CardData | null>(null)
  const [isCreatingCard, setIsCreatingCard] = useState(false)

  // Customization state
  const [template, setTemplate] = useState<CompletionCardTemplate>('CLASSIC')
  const [caption, setCaption] = useState('')
  const [showHost, setShowHost] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [showDuration, setShowDuration] = useState(true)
  const [showStreak, setShowStreak] = useState(false)
  const [streak, setStreak] = useState(0)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Upload hooks
  const { startUpload: startPhotoUpload } = useUploadThing('completionCardPhoto')
  const { startUpload: startCardUpload } = useUploadThing('completionCardGenerated')

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('upload')
      setPhotoFile(null)
      setPhotoPreview(null)
      setCard(null)
      setTemplate('CLASSIC')
      setCaption('')
      setShowHost(true)
      setShowDate(true)
      setShowDuration(true)
      setShowStreak(false)
      setStreak(0)
      setGeneratedImageUrl(null)
    }
  }, [open])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB')
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [])

  // Upload photo and create card
  const handleUploadAndCreate = async () => {
    if (!photoFile) return

    setIsUploading(true)
    toast.info('Uploading your photo...')

    try {
      // Upload photo
      const result = await startPhotoUpload([photoFile])
      if (!result?.[0]) {
        throw new Error('Upload failed')
      }

      const photoUrl = `https://utfs.io/f/${result[0].key}`

      setIsCreatingCard(true)
      toast.info('Creating your completion card...')

      // Create card via API
      const response = await fetch('/api/completion-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userActivityId,
          photoUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create card')
      }

      const data = await response.json()
      setCard(data.card)
      setStreak(data.card.streak || 0)
      setShowStreak(data.card.showStreak || false)

      toast.success('Card created! Now customize it.')
      setStep('customize')
    } catch (error) {
      console.error('Upload/create error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create card')
    } finally {
      setIsUploading(false)
      setIsCreatingCard(false)
    }
  }

  // Update card customization
  const updateCard = async (updates: Partial<{
    template: CompletionCardTemplate
    caption: string | null
    showHost: boolean
    showDate: boolean
    showDuration: boolean
    showStreak: boolean
  }>) => {
    if (!card) return

    try {
      const response = await fetch(`/api/completion-cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update card')
      }

      const data = await response.json()
      setCard(data.card)
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to save changes')
    }
  }

  // Generate card image using canvas
  const generateCardImage = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // Instagram Story dimensions (9:16)
      const width = 1080
      const height = 1920
      canvas.width = width
      canvas.height = height

      const templateConfig = TEMPLATES[template]

      // Draw background
      if (templateConfig.bgGradient) {
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, templateConfig.bgGradient[0])
        gradient.addColorStop(1, templateConfig.bgGradient[1])
        ctx.fillStyle = gradient
      } else {
        ctx.fillStyle = templateConfig.bgColor || '#FFFFFF'
      }
      ctx.fillRect(0, 0, width, height)

      // Load and draw user photo
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Draw photo with overlay
        const photoY = 200
        const photoHeight = 800

        // Draw photo
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(60, photoY, width - 120, photoHeight, 24)
        ctx.clip()

        // Scale and center photo
        const scale = Math.max(
          (width - 120) / img.width,
          photoHeight / img.height
        )
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const x = 60 + ((width - 120) - scaledWidth) / 2
        const y = photoY + (photoHeight - scaledHeight) / 2

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

        // Add overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${templateConfig.overlayOpacity * 0.3})`
        ctx.fillRect(60, photoY, width - 120, photoHeight)
        ctx.restore()

        // Draw SweatBuddies logo/branding at top
        ctx.fillStyle = templateConfig.textColor
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('SweatBuddies', width / 2, 120)

        // Draw activity title
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif'
        ctx.fillText(activityTitle, width / 2, 1120)

        // Draw caption if provided
        let yOffset = 1200
        if (caption) {
          ctx.font = '36px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = templateConfig.textColor

          // Word wrap caption
          const words = caption.split(' ')
          let line = ''
          const maxWidth = width - 160

          for (const word of words) {
            const testLine = line + word + ' '
            const metrics = ctx.measureText(testLine)
            if (metrics.width > maxWidth && line !== '') {
              ctx.fillText(line.trim(), width / 2, yOffset)
              line = word + ' '
              yOffset += 50
            } else {
              line = testLine
            }
          }
          ctx.fillText(line.trim(), width / 2, yOffset)
          yOffset += 80
        }

        // Draw metadata pills
        const pillY = yOffset + 40
        const pills: string[] = []

        if (showHost) {
          pills.push(`with ${hostName}`)
        }
        if (showDate) {
          pills.push(new Date(completedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }))
        }
        if (showDuration && durationMinutes) {
          const hours = Math.floor(durationMinutes / 60)
          const mins = durationMinutes % 60
          pills.push(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`)
        }
        if (showStreak && streak >= 2) {
          pills.push(`${streak} week streak 🔥`)
        }

        if (pills.length > 0) {
          ctx.font = '32px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = templateConfig.accentColor
          ctx.fillText(pills.join('  •  '), width / 2, pillY)
        }

        // Draw QR code placeholder (actual QR would be loaded from card.qrCodeUrl)
        const qrSize = 150
        const qrX = width - qrSize - 80
        const qrY = height - qrSize - 120
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12)
        ctx.fill()

        // Draw "Scan to join" text
        ctx.fillStyle = templateConfig.textColor
        ctx.font = '24px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('Scan to join', width - 80, height - 60)

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png', 1.0)
        resolve(dataUrl)
      }

      img.onerror = () => {
        reject(new Error('Failed to load photo'))
      }

      img.src = card?.photoUrl || photoPreview || ''
    })
  }, [template, caption, showHost, showDate, showDuration, showStreak, streak, activityTitle, hostName, completedAt, durationMinutes, card, photoPreview])

  // Handle generate and preview
  const handleGenerate = async () => {
    if (!card) return

    setIsGenerating(true)
    toast.info('Generating your card...')

    try {
      // Save customizations first
      await updateCard({
        template,
        caption: caption || null,
        showHost,
        showDate,
        showDuration,
        showStreak,
      })

      // Generate image
      const dataUrl = await generateCardImage()
      setGeneratedImageUrl(dataUrl)

      // Convert data URL to file for upload
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `completion-card-${card.id}.png`, { type: 'image/png' })

      // Upload generated card
      const uploadResult = await startCardUpload([file])
      if (!uploadResult?.[0]) {
        throw new Error('Failed to upload generated card')
      }

      const cardUrl = `https://utfs.io/f/${uploadResult[0].key}`

      // Mark card as generated
      await fetch(`/api/completion-cards/${card.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUrl }),
      })

      toast.success('Card generated!')
      setStep('preview')
    } catch (error) {
      console.error('Generate error:', error)
      toast.error('Failed to generate card')
    } finally {
      setIsGenerating(false)
    }
  }

  // Download card
  const handleDownload = async () => {
    if (!generatedImageUrl || !card) return

    try {
      const link = document.createElement('a')
      link.href = generatedImageUrl
      link.download = `sweatbuddies-${activityTitle.toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Record download
      await fetch(`/api/completion-cards/${card.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'download' }),
      })

      toast.success('Card downloaded!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download')
    }
  }

  // Share to platform
  const handleShare = async (platform: 'instagram' | 'whatsapp' | 'twitter') => {
    if (!generatedImageUrl || !card) return

    try {
      // Record share
      await fetch(`/api/completion-cards/${card.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })

      const shareText = `Just completed ${activityTitle} on SweatBuddies! 💪`
      const shareUrl = card.activityLink || ''

      if (platform === 'instagram') {
        // For Instagram, user needs to download and share manually
        handleDownload()
        toast.info('Image downloaded! Open Instagram and share from your gallery.')
      } else if (platform === 'whatsapp') {
        const message = encodeURIComponent(`${shareText}\n\n${shareUrl}`)
        window.open(`https://wa.me/?text=${message}`, '_blank')
      } else if (platform === 'twitter') {
        const text = encodeURIComponent(shareText)
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank')
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to share')
    }
  }

  // Handle native share
  const handleNativeShare = async () => {
    if (!generatedImageUrl || !card) return

    try {
      // Convert data URL to blob
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'sweatbuddies-completion.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: activityTitle,
          text: `Just completed ${activityTitle} on SweatBuddies! 💪`,
        })

        // Record share
        await fetch(`/api/completion-cards/${card.id}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'native' }),
        })

        toast.success('Shared successfully!')
      } else {
        // Fallback to download
        handleDownload()
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Native share error:', error)
        handleDownload()
      }
    }
  }

  const handleClose = () => {
    if (card && onComplete) {
      onComplete(card.id)
    }
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Header */}
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            {step !== 'upload' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(step === 'preview' ? 'customize' : 'upload')}
                disabled={isGenerating}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <DialogTitle className="flex-1 text-center">
              {step === 'upload' && 'Add Your Photo'}
              {step === 'customize' && 'Customize Card'}
              {step === 'preview' && 'Your Card'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <DialogDescription className="text-center">
            {step === 'upload' && 'Upload a photo from your activity'}
            {step === 'customize' && 'Choose a style and add your message'}
            {step === 'preview' && 'Download or share your completion card'}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="p-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              {!photoPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Take or upload a photo</p>
                      <p className="text-sm text-muted-foreground">
                        Show off your activity!
                      </p>
                    </div>
                    <Button variant="outline" className="mt-2">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-[3/4] relative rounded-xl overflow-hidden">
                    <Image
                      src={photoPreview}
                      alt="Your photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview(null)
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Change
                  </Button>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!photoFile || isUploading || isCreatingCard}
                onClick={handleUploadAndCreate}
              >
                {isUploading || isCreatingCard ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Creating card...'}
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Continue
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Customize */}
          {step === 'customize' && card && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Template</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TEMPLATES).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setTemplate(key as CompletionCardTemplate)}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-sm',
                        template === key
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      )}
                      style={{
                        background: config.bgGradient
                          ? `linear-gradient(135deg, ${config.bgGradient[0]}, ${config.bgGradient[1]})`
                          : config.bgColor,
                        color: config.textColor,
                      }}
                    >
                      {config.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Caption (optional)
                </label>
                <Textarea
                  placeholder="Add a message to your card..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={150}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {caption.length}/150 characters
                </p>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Show on card</label>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Host name</span>
                  </div>
                  <Switch
                    checked={showHost}
                    onCheckedChange={setShowHost}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Date</span>
                  </div>
                  <Switch
                    checked={showDate}
                    onCheckedChange={setShowDate}
                  />
                </div>

                {durationMinutes && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <Switch
                      checked={showDuration}
                      onCheckedChange={setShowDuration}
                    />
                  </div>
                )}

                {streak >= 2 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">{streak} week streak</span>
                    </div>
                    <Switch
                      checked={showStreak}
                      onCheckedChange={setShowStreak}
                    />
                  </div>
                )}
              </div>

              {/* Preview Thumbnail */}
              <div className="bg-muted rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div
                  className="aspect-[9/16] rounded-lg overflow-hidden relative"
                  style={{
                    background: TEMPLATES[template].bgGradient
                      ? `linear-gradient(135deg, ${TEMPLATES[template].bgGradient![0]}, ${TEMPLATES[template].bgGradient![1]})`
                      : TEMPLATES[template].bgColor,
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center p-4">
                    <p
                      className="text-xs font-bold mt-2"
                      style={{ color: TEMPLATES[template].textColor }}
                    >
                      SweatBuddies
                    </p>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-3/4 aspect-square rounded-lg overflow-hidden relative">
                        {card.photoUrl && (
                          <Image
                            src={card.photoUrl}
                            alt="Your photo"
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    </div>
                    <p
                      className="text-xs font-semibold text-center"
                      style={{ color: TEMPLATES[template].textColor }}
                    >
                      {activityTitle}
                    </p>
                    {caption && (
                      <p
                        className="text-[8px] text-center mt-1 line-clamp-2"
                        style={{ color: TEMPLATES[template].textColor, opacity: 0.8 }}
                      >
                        {caption}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Generate Card
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Preview & Share */}
          {step === 'preview' && generatedImageUrl && (
            <div className="space-y-4">
              {/* Generated Card Preview */}
              <div className="aspect-[9/16] rounded-xl overflow-hidden relative bg-muted">
                <Image
                  src={generatedImageUrl}
                  alt="Your completion card"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Share Actions */}
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleNativeShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleShare('instagram')}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-xs">Instagram</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('whatsapp')}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('twitter')}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span className="text-xs">X</span>
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Image
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
