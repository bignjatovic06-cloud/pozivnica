"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users, LayoutDashboard, Camera, ExternalLink, ArrowLeft, Heart, LogOut, Copy, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getEvent } from "@/lib/db";
import { logOut } from "@/lib/auth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RSVPManagement from "./components/RSVPManagement";
import SeatingChartBuilder from "./components/SeatingChartBuilder";
import PhotoManagement from "./components/PhotoManagement";

type Tab = "rsvp" | "seating" | "photos";

export default function AdminEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("rsvp");
  const [copied, setCopied] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/admin/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (event && user && event.adminId !== user.uid) {
      toast.error("Nemate pristup ovom eventu");
      router.push("/admin/dashboard");
    }
  }, [event, user, router]);

  const handleLogout = async () => {
    await logOut();
    router.push("/admin/login");
  };

  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/event/${eventId}` : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    toast.success("Link kopiran!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) return null;

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "rsvp", label: "RSVP", icon: Users },
    { id: "seating", label: "Raspored sjedenja", icon: LayoutDashboard },
    { id: "photos", label: "Fotografije", icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </Link>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#8B5A8E] fill-current" />
                <div>
                  <h1 className="font-bold text-gray-800 text-sm leading-tight">{event.coupleNames}</h1>
                  <p className="text-xs text-gray-500">{event.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Event link copy */}
              <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500 truncate max-w-48">{eventUrl}</span>
                <button onClick={copyLink} className="text-[#8B5A8E] hover:text-[#6d4570] flex-shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <Link href={`/event/${eventId}`} target="_blank" className="p-2 rounded-lg hover:bg-gray-100" title="Pregled pozivnice">
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </Link>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100" title="Odjava">
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Mobile copy link */}
          <div className="md:hidden mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <span className="text-xs text-gray-500 truncate flex-1">{eventUrl}</span>
            <button onClick={copyLink} className="text-[#8B5A8E]">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 border-t border-gray-100 pt-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`tab-button ${activeTab === id ? "active" : ""}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "rsvp" && <RSVPManagement eventId={eventId} />}
        {activeTab === "seating" && <SeatingChartBuilder eventId={eventId} />}
        {activeTab === "photos" && <PhotoManagement eventId={eventId} />}
      </main>
    </div>
  );
}
