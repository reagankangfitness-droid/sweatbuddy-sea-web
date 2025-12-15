"use client";

import { ReactNode } from "react";

interface IPhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export function IPhoneMockup({ children, className = "" }: IPhoneMockupProps) {
  return (
    <div className={`relative ${className}`}>
      {/* iPhone Frame - larger on desktop (320px vs 280px) */}
      <div className="relative mx-auto w-[280px] h-[570px] lg:w-[320px] lg:h-[650px] bg-[#1a1a1a] rounded-[50px] shadow-xl border-[12px] border-[#1a1a1a]">

        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-black rounded-full z-20" />

        {/* Screen */}
        <div className="relative w-full h-full bg-white rounded-[38px] overflow-hidden">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-white z-10 flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold text-black">9:41</span>
            <div className="flex items-center gap-1 text-black">
              {/* Signal */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 17h2v4H2zM6 13h2v8H6zM10 9h2v12h-2zM14 5h2v16h-2zM18 1h2v20h-2z"/>
              </svg>
              {/* WiFi */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-6c3.3 0 6 2.7 6 6h-2c0-2.2-1.8-4-4-4s-4 1.8-4 4H6c0-3.3 2.7-6 6-6zm0-6c5.5 0 10 4.5 10 10h-2c0-4.4-3.6-8-8-8s-8 3.6-8 8H2c0-5.5 4.5-10 10-10z"/>
              </svg>
              {/* Battery */}
              <div className="w-6 h-3 border border-current rounded-sm relative">
                <div className="absolute inset-0.5 bg-current rounded-sm" style={{width: '70%'}}/>
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-current rounded-r"/>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="pt-12 h-full overflow-hidden">
            {children}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full" />
        </div>
      </div>

      {/* Reflection Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[50px] pointer-events-none" />

      {/* Shadow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[200px] h-[30px] bg-black/15 blur-2xl rounded-full" />
    </div>
  );
}
