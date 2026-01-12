'use client'

import { useState, useEffect } from 'react'
import { Shield, ChevronDown, FileText, Edit3 } from 'lucide-react'

interface WaiverTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  isDefault: boolean
  content: string
}

interface WaiverSectionProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  templateId: string | null
  onTemplateChange: (id: string | null) => void
  customText: string
  onCustomTextChange: (text: string) => void
}

export function WaiverSection({
  enabled,
  onToggle,
  templateId,
  onTemplateChange,
  customText,
  onCustomTextChange,
}: WaiverSectionProps) {
  const [templates, setTemplates] = useState<WaiverTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [useCustom, setUseCustom] = useState(!templateId && !!customText)
  const [showPreview, setShowPreview] = useState(false)

  // Fetch templates when section is enabled
  useEffect(() => {
    if (enabled && templates.length === 0) {
      setLoading(true)
      fetch('/api/waiver-templates')
        .then(res => res.json())
        .then(data => {
          setTemplates(data.templates || [])
          // If no template selected and there's a default, select it
          if (!templateId && !customText) {
            const defaultTemplate = data.templates?.find((t: WaiverTemplate) => t.isDefault)
            if (defaultTemplate) {
              onTemplateChange(defaultTemplate.id)
            }
          }
        })
        .catch(err => console.error('Failed to load templates:', err))
        .finally(() => setLoading(false))
    }
  }, [enabled, templates.length, templateId, customText, onTemplateChange])

  const selectedTemplate = templates.find(t => t.id === templateId)

  const handleModeChange = (isCustom: boolean) => {
    setUseCustom(isCustom)
    if (isCustom) {
      onTemplateChange(null)
    } else {
      onCustomTextChange('')
      // Select default template
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0]
      if (defaultTemplate) {
        onTemplateChange(defaultTemplate.id)
      }
    }
  }

  return (
    <div className="border-t border-neutral-200 pt-6 mt-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Liability Waiver</h3>
            <p className="text-sm text-neutral-500">Require attendees to sign before joining</p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-neutral-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Expanded section when enabled */}
      {enabled && (
        <div className="mt-4 space-y-4 pl-13">
          {/* Mode selection */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleModeChange(false)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                !useCustom
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                <span className="font-medium text-sm">Use Template</span>
              </div>
              <p className="text-xs text-neutral-500">Choose from pre-made waivers</p>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange(true)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                useCustom
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Edit3 className="w-4 h-4" />
                <span className="font-medium text-sm">Custom Waiver</span>
              </div>
              <p className="text-xs text-neutral-500">Write your own waiver text</p>
            </button>
          </div>

          {/* Template selector */}
          {!useCustom && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Template
              </label>
              {loading ? (
                <div className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
              ) : (
                <div className="relative">
                  <select
                    value={templateId || ''}
                    onChange={(e) => onTemplateChange(e.target.value || null)}
                    className="w-full appearance-none px-4 py-3 pr-10 border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a waiver template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.isDefault ? '(Recommended)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                </div>
              )}

              {/* Template preview */}
              {selectedTemplate && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showPreview ? 'Hide preview' : 'Preview waiver text'}
                  </button>

                  {showPreview && (
                    <div className="mt-2 p-4 bg-neutral-50 rounded-lg max-h-60 overflow-y-auto text-sm text-neutral-600 whitespace-pre-wrap border border-neutral-200">
                      {selectedTemplate.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom waiver text */}
          {useCustom && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Waiver Text
              </label>
              <textarea
                value={customText}
                onChange={(e) => onCustomTextChange(e.target.value)}
                rows={8}
                placeholder="Enter your liability waiver text here. Include all necessary legal language for participants to acknowledge the risks of the activity..."
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Tip: Include acknowledgment of risks, release of liability, and confirmation of fitness to participate.
              </p>
            </div>
          )}

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>How it works:</strong> Attendees must read and agree to the waiver before completing their RSVP.
              You can view all signed waivers in your attendee management page.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
