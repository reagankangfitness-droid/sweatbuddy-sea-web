"use client";

import { useState } from "react";
import Image from "next/image";

const filters = ["All", "Run", "Yoga", "HIIT", "Dance"];

const events = [
  {
    id: 1,
    name: "Sunrise Run",
    category: "Run",
    time: "Sat 6:30AM",
    location: "East Coast Park",
    going: 24,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop",
    organizer: "runsg"
  },
  {
    id: 2,
    name: "Fort Canning Flow",
    category: "Yoga",
    time: "Sun 7:30AM",
    location: "Fort Canning Green",
    going: 18,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
    organizer: "yogamovement"
  },
  {
    id: 3,
    name: "Beach Bootcamp",
    category: "HIIT",
    time: "Sat 8:00AM",
    location: "Sentosa Beach",
    going: 32,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    organizer: "f45sentosa"
  },
];

const categoryColors: Record<string, string> = {
  Run: "bg-cyan-100 text-cyan-700",
  Yoga: "bg-purple-100 text-purple-700",
  HIIT: "bg-orange-100 text-orange-700",
  Dance: "bg-pink-100 text-pink-700",
};

export function EventBrowser() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="h-full bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-2">
        <h2 className="text-lg font-bold text-neutral-900">What&apos;s On</h2>
        <p className="text-[10px] text-neutral-500">Singapore &middot; This Week</p>
      </div>

      {/* Filter Pills */}
      <div className="px-4 py-2 bg-white border-b border-neutral-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden"
          >
            {/* Event Image */}
            <div className="relative h-24 w-full">
              <Image
                src={event.image}
                alt={event.name}
                fill
                className="object-cover"
                sizes="(max-width: 400px) 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Category Badge */}
              <span className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-medium ${categoryColors[event.category] || "bg-neutral-100 text-neutral-700"}`}>
                {event.category}
              </span>

              {/* Going Count */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                <div className="flex -space-x-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38BDF8] border border-white" />
                  ))}
                </div>
                <span className="text-[9px] font-medium text-neutral-700">{event.going}</span>
              </div>
            </div>

            {/* Event Info */}
            <div className="p-3">
              <h3 className="font-bold text-xs text-neutral-900 mb-0.5">{event.name}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <span>{event.time}</span>
                <span className="text-neutral-300">&middot;</span>
                <span className="truncate">{event.location}</span>
              </div>

              {/* Footer with organizer and button */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]" />
                  <span className="text-[9px] text-neutral-500">@{event.organizer}</span>
                </div>
                <button className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white text-[9px] font-medium rounded-full">
                  <span>🙋</span>
                  <span>Going</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
