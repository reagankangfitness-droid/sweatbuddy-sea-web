"use client";

import { useState } from "react";

export function EventDetail() {
  const [isGoing, setIsGoing] = useState(false);

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Hero Image */}
      <div className="h-36 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] relative">
        {/* Back Button */}
        <button className="absolute top-4 left-4 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Save Button */}
        <button className="absolute top-4 right-4 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Event Info on Image */}
        <div className="absolute bottom-4 left-4 right-4">
          <span className="text-xs bg-white/20 backdrop-blur text-white px-2 py-1 rounded-full">
            Run Club
          </span>
          <h2 className="text-xl font-bold text-white mt-2">Sunrise Run</h2>
          <p className="text-sm text-white/80">East Coast Park</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* Time & Location */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base">&#128197;</span>
            <span>Saturdays</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base">&#128336;</span>
            <span>6:30 AM</span>
          </div>
        </div>

        {/* Location Detail */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-base">&#128205;</span>
          <span>Carpark C, East Coast Park</span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">
          5K group run along the coast. All paces welcome. We meet at Carpark C and run together as a group.
        </p>

        {/* Organizer */}
        <div className="flex items-center gap-3 py-3 border-t border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38BDF8]" />
          <div>
            <p className="text-sm font-semibold">@runnerssg</p>
            <p className="text-xs text-gray-400">Organizer</p>
          </div>
        </div>

        {/* Going Section */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38BDF8] border-2 border-white"
                />
              ))}
              <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                +20
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-500">24 going</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setIsGoing(!isGoing)}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            isGoing
              ? "bg-green-500 text-white"
              : "bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white"
          }`}
        >
          {isGoing ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              You&apos;re Going!
            </>
          ) : (
            <>
              <span>&#128587;</span>
              I&apos;m Going
            </>
          )}
        </button>
      </div>
    </div>
  );
}
