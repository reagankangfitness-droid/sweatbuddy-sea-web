'use client'

import { useState } from 'react'
import { Info, HelpCircle } from 'lucide-react'
import {
  calculateFees,
  formatCurrency,
  FEE_CONFIG,
  getAttendeeFeeExplanation,
} from '@/lib/constants/fees'
import { cn } from '@/lib/utils'

interface PriceBreakdownProps {
  ticketPrice: number
  quantity?: number
  showDetailed?: boolean
  variant?: 'default' | 'compact' | 'checkout'
  className?: string
}

export function PriceBreakdown({
  ticketPrice,
  quantity = 1,
  showDetailed = false,
  variant = 'default',
  className,
}: PriceBreakdownProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const fees = calculateFees(ticketPrice, quantity)

  // Free activity
  if (ticketPrice === 0) {
    return (
      <div className={cn('', className)}>
        <span className="text-lg font-semibold text-emerald-500">Free Activity</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('', className)}>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(fees.attendeePays)}
          </span>
        </div>
        {fees.serviceFee > 0 && FEE_CONFIG.serviceFeePaidBy === 'attendee' && (
          <p className="text-xs text-gray-400 mt-1">
            Includes {formatCurrency(fees.serviceFee)} service fee
          </p>
        )}
      </div>
    )
  }

  if (variant === 'checkout') {
    return (
      <div className={cn('bg-blue-50 rounded-2xl p-5', className)}>
        <div className="space-y-3">
          {/* Ticket line */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[15px] text-gray-600">
              {quantity > 1 ? `${quantity} × ` : ''}Ticket
              {quantity > 1 && ` @ ${formatCurrency(ticketPrice)}`}
            </span>
            <span className="text-[15px] font-medium text-gray-900">
              {formatCurrency(fees.subtotal)}
            </span>
          </div>

          {/* Service fee line */}
          {fees.serviceFee > 0 && FEE_CONFIG.serviceFeePaidBy === 'attendee' && (
            <div className="flex justify-between items-center py-2">
              <span className="text-[15px] text-gray-600 flex items-center gap-1.5">
                {FEE_CONFIG.feeLabel}
                <span
                  className="relative cursor-help text-gray-400 hover:text-[#0025CC] transition-colors"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <HelpCircle size={14} />
                  {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
                      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg w-60 text-center leading-relaxed">
                        {getAttendeeFeeExplanation()}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
                    </div>
                  )}
                </span>
              </span>
              <span className="text-[15px] font-medium text-gray-900">
                {formatCurrency(fees.serviceFee)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-200 my-2" />

          {/* Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(fees.attendeePays)}
            </span>
          </div>
        </div>

        {/* Detailed breakdown */}
        {showDetailed && (
          <div className="mt-5 pt-5 border-t border-dashed border-gray-300">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Breakdown
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500">Host receives</span>
                <span className="text-sm font-medium text-emerald-600">
                  {formatCurrency(fees.hostReceives)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500">Service fee</span>
                <span className="text-sm font-medium text-gray-600">
                  {formatCurrency(fees.serviceFee)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default variant - activity page price display
  return (
    <div className={cn('', className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {formatCurrency(fees.attendeePaysPerTicket)}
        </span>
        <span className="text-sm text-gray-500">per person</span>
      </div>

      {fees.serviceFee > 0 && FEE_CONFIG.serviceFeePaidBy === 'attendee' && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
          <Info size={14} />
          <span>
            {formatCurrency(ticketPrice)} + {formatCurrency(fees.serviceFeePerTicket)} fee
          </span>
        </div>
      )}
    </div>
  )
}

export default PriceBreakdown
