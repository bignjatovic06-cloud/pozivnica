"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Info, ClipboardList, Camera, Armchair } from "lucide-react";
import { getEvent } from "@/lib/db";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import InfoTab from "./components/InfoTab";
import RSVPTab from "./components/RSVPTab";
import PhotosTab from "./components/PhotosTab";
import SeatingTab from "./components/SeatingTab";

type Tab = "info" | "rsvp" | "photos" | "seating";

const GUEST_KEY = (eventId: string) => `guest_${eventId}`;

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [guestId, setGuestId] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem(GUEST_KEY(eventId));
    return null;
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
  });

  const handleRSVPComplete = (newGuestId: string) => {
    localStorage.setItem(GUEST_KEY(eventId), newGuestId);
    setGuestId(newGuestId);
    setActiveTab("seating");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Event nije pronađen</h1>
          <p className="text-gray-500">Provjerite link koji ste dobili</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
    { id: "info", label: "Info", icon: Info },
    { id: "rsvp", label: "RSVP", icon: ClipboardList },
    { id: "photos", label: "Slike", icon: Camera },
    { id: "seating", label: "Moj stol", icon: Armchair },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-[#8B5A8E] to-[#6d4570] text-white py-10 px-6 text-center">
        <p className="text-[#D4A574] text-sm font-medium tracking-widest uppercase mb-2">Pozivnica</p>
        <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
          {event.coupleNames}
        </h1>
        <p className="text-purple-200 text-sm">{event.name}</p>
      </div>

      {/* Sticky tabs */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all border-b-2 ${
                  activeTab === id
                    ? "border-[#8B5A8E] text-[#8B5A8E]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "info" && <InfoTab event={event} />}
        {activeTab === "rsvp" && (
          <RSVPTab
            eventId={eventId}
            guestId={guestId}
            onComplete={handleRSVPComplete}
          />
        )}
        {activeTab === "photos" && <PhotosTab eventId={eventId} guestId={guestId} />}
        {activeTab === "seating" && <SeatingTab eventId={eventId} guestId={guestId} />}
      </div>
    </div>
  );
}
