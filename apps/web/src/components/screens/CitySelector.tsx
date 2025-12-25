"use client";

import { useState } from "react";

interface City {
  id: string;
  name: string;
  flag: string;
  status: "active" | "coming-soon";
  eventCount?: number;
  launchDate?: string;
}

const cities: City[] = [
  { id: "singapore", name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}", status: "active", eventCount: 52 },
  { id: "kuala-lumpur", name: "Kuala Lumpur", flag: "\u{1F1F2}\u{1F1FE}", status: "coming-soon", launchDate: "January 2025" },
  { id: "bangkok", name: "Bangkok", flag: "\u{1F1F9}\u{1F1ED}", status: "coming-soon", launchDate: "Q1 2025" },
];

export function CitySelector() {
  const [selected, setSelected] = useState("singapore");

  return (
    <div className="h-full bg-white px-4 py-6 flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-neutral-900">Pick Your City</h2>
        <p className="text-xs text-neutral-500 mt-1">Where are you working out?</p>
      </div>

      {/* City Cards */}
      <div className="flex-1 space-y-3">
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => city.status === "active" && setSelected(city.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected === city.id
                ? "border-[#2563EB] bg-[#2563EB]/5"
                : city.status === "active"
                ? "border-neutral-200 hover:border-neutral-300"
                : "border-neutral-100 opacity-50 cursor-not-allowed"
            }`}
            disabled={city.status === "coming-soon"}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{city.flag}</span>
                <div>
                  <p className={`font-semibold text-sm ${
                    city.status === "coming-soon" ? "text-neutral-400" : "text-neutral-900"
                  }`}>
                    {city.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {city.status === "active"
                      ? `${city.eventCount} events live`
                      : `Coming ${city.launchDate}`
                    }
                  </p>
                </div>
              </div>

              {city.status === "active" && (
                <div className="flex items-center gap-2">
                  {selected === city.id && (
                    <svg className="w-5 h-5 text-[#2563EB]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <button className="w-full mt-4 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white py-3 rounded-xl font-semibold text-sm">
        Continue
      </button>
    </div>
  );
}
