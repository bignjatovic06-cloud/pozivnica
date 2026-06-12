"use client";

import { useSyncExternalStore } from "react";
import { Calendar, Clock, MapPin, Car, Shirt } from "lucide-react";
import type { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface Props {
  event: Event;
}

const emptySubscribe = () => () => {};

export default function InfoTab({ event }: Props) {
  // window.location ne postoji na serveru — server render vraća "",
  // klijent pravi URL, bez hydration mismatcha
  const shareUrl = useSyncExternalStore(
    emptySubscribe,
    () => window.location.href,
    () => ""
  );

  const details = [
    { icon: Calendar, label: "Datum", value: formatDate(event.date) },
    { icon: Clock, label: "Vrijeme", value: `${event.time} — ${event.endTime}` },
    { icon: MapPin, label: "Lokacija", value: event.location, sub: event.address },
    { icon: Car, label: "Parking", value: event.parkingInfo || "Info nije dodan" },
    { icon: Shirt, label: "Dress code", value: event.dressCode },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Event details card */}
      <div className="card">
        <h2 className="text-xl font-bold text-[#8B5A8E] mb-5">Detalji svadbe</h2>
        <div className="space-y-4">
          {details.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#8B5A8E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#8B5A8E]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="font-semibold text-gray-800">{value}</p>
                {sub && <p className="text-sm text-gray-500">{sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map link */}
      {event.address && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block card hover:shadow-md transition-shadow text-center"
        >
          <div className="flex items-center justify-center gap-2 text-[#8B5A8E] font-semibold">
            <MapPin className="w-5 h-5" />
            Prikaži na Google Maps →
          </div>
        </a>
      )}

      {/* Timeline */}
      {event.eventTimeline?.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-[#8B5A8E] mb-5">Program</h2>
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#8B5A8E]/20" />
            <div className="space-y-4">
              {event.eventTimeline.map((item, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-10 h-10 bg-[#8B5A8E] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform z-10">
                    <span className="text-white text-xs font-bold">{item.time}</span>
                  </div>
                  <div className="pt-2">
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Viber share */}
      <a
        href={`viber://forward?text=${encodeURIComponent(`Pozivnica za ${event.coupleNames}: ${shareUrl}`)}`}
        className="block card hover:shadow-md transition-shadow text-center"
      >
        <div className="flex items-center justify-center gap-2 font-semibold" style={{ color: "#7360f2" }}>
          <span className="text-lg">📱</span>
          Pošalji link na Viber
        </div>
      </a>
    </div>
  );
}
