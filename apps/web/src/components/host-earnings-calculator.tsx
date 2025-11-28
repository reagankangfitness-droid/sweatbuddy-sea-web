'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Info, Check } from 'lucide-react'
import {
  calculateFees,
  formatCurrency,
  getHostFeeExplanation,
  getFeeDescription,
  FeeCalculation,
} from '@/lib/constants/fees'
import { cn } from '@/lib/utils'

interface HostEarningsCalculatorProps {
  initialPrice?: number
  initialAttendees?: number
  showCalculator?: boolean
  className?: string
}

export function HostEarningsCalculator({
  initialPrice = 25,
  initialAttendees = 10,
  showCalculator = true,
  className,
}: HostEarningsCalculatorProps) {
  const [ticketPrice, setTicketPrice] = useState(initialPrice)
  const [expectedAttendees, setExpectedAttendees] = useState(initialAttendees)
  const [fees, setFees] = useState<FeeCalculation | null>(null)

  useEffect(() => {
    const calculated = calculateFees(ticketPrice, expectedAttendees)
    setFees(calculated)
  }, [ticketPrice, expectedAttendees])

  if (!fees) return null

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
      {/* Header */}
      <div className="flex gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0025CC] flex items-center justify-center flex-shrink-0">
          <TrendingUp size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Earnings Calculator</h3>
          <p className="text-sm text-gray-500">See how much you&apos;ll earn per activity</p>
        </div>
      </div>

      {/* Key benefit callout */}
      <div className="flex items-center justify-center gap-2.5 text-[15px] text-emerald-700 bg-emerald-100 px-5 py-3.5 rounded-xl mb-6">
        <Check size={18} />
        <span>
          You receive <strong className="font-bold">100%</strong> of your ticket price
        </span>
      </div>

      {/* Input section */}
      {showCalculator && (
        <div className="grid grid-cols-2 gap-4 mb-6 max-[480px]:grid-cols-1">
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-2">
              Your Ticket Price
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#0025CC] focus-within:ring-2 focus-within:ring-[#0025CC]/10">
              <span className="flex items-center justify-center px-3.5 bg-gray-100 text-gray-500 text-sm font-medium h-12 border-r border-gray-200">
                S$
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 text-lg font-semibold px-3.5 py-3 border-none outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-2">
              Expected Attendees
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#0025CC] focus-within:ring-2 focus-within:ring-[#0025CC]/10">
              <span className="flex items-center justify-center px-3.5 bg-gray-100 text-gray-500 h-12 border-r border-gray-200">
                <Users size={16} />
              </span>
              <input
                type="number"
                min="1"
                max="100"
                value={expectedAttendees}
                onChange={(e) =>
                  setExpectedAttendees(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="flex-1 text-lg font-semibold px-3.5 py-3 border-none outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results section */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-4 mb-6 max-[480px]:grid-cols-1">
        {/* What host earns - prominent */}
        <div className="bg-[#0025CC] rounded-2xl px-5 py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80 mb-2">
            You earn
          </p>
          <p className="text-[40px] font-bold text-white">{formatCurrency(fees.hostReceives)}</p>
          <p className="text-[13px] text-white/70 mt-1.5">
            {formatCurrency(ticketPrice)} × {expectedAttendees} attendees
          </p>
        </div>

        {/* What attendees pay */}
        <div className="bg-gray-100 rounded-2xl px-5 py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Attendees pay
          </p>
          <p className="text-[28px] font-bold text-gray-900">
            {formatCurrency(fees.attendeePaysPerTicket)}
          </p>
          <p className="text-[13px] text-gray-500 mt-1.5">per person</p>
        </div>
      </div>

      {/* How it works breakdown */}
      <div className="bg-gray-50 rounded-2xl p-5 mb-5">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-2.5">
          <h4 className="text-[15px] font-semibold text-gray-900">How it works</h4>
          <span className="text-xs font-medium text-[#0025CC] bg-blue-100 px-3 py-1.5 rounded-full">
            {getFeeDescription()} service fee
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Step 1 */}
          <div className="flex items-center gap-3.5 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0025CC] flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">You set your price</p>
              <p className="text-[13px] text-gray-500">{formatCurrency(ticketPrice)} per ticket</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3.5 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0025CC] flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">We add a small service fee</p>
              <p className="text-[13px] text-gray-500">
                {formatCurrency(fees.serviceFeePerTicket)} per ticket (paid by attendee)
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3.5 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0025CC] flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Attendees pay total</p>
              <p className="text-[13px] text-gray-500">
                {formatCurrency(fees.attendeePaysPerTicket)} per ticket
              </p>
            </div>
          </div>

          {/* Step 4 - Success */}
          <div className="flex items-center gap-3.5 p-3 bg-emerald-100 rounded-xl border border-emerald-200">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">You receive 100%</p>
              <p className="text-[13px] text-gray-500">
                {formatCurrency(fees.hostReceives)} total ({expectedAttendees} attendees)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="flex items-start gap-2.5 text-[13px] text-gray-600 leading-relaxed p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
        <Info size={16} className="flex-shrink-0 text-[#0025CC] mt-0.5" />
        <span>{getHostFeeExplanation()}</span>
      </div>

      {/* Monthly potential */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3.5">Monthly earning potential</h4>
        <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1.5">4×/month</p>
            <p className="text-[22px] font-bold text-[#0025CC]">
              {formatCurrency(fees.hostReceives * 4)}
            </p>
          </div>
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1.5">8×/month</p>
            <p className="text-[22px] font-bold text-[#0025CC]">
              {formatCurrency(fees.hostReceives * 8)}
            </p>
          </div>
          <div className="bg-blue-100 border-2 border-[#0025CC] rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1.5">12×/month</p>
            <p className="text-[22px] font-bold text-[#0025CC]">
              {formatCurrency(fees.hostReceives * 12)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostEarningsCalculator
