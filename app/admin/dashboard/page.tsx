"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Users, ExternalLink, Heart } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getEventsByAdmin } from "@/lib/db";
import { logOut } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/admin/login");
  }, [user, loading, router]);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", user?.uid],
    queryFn: () => getEventsByAdmin(user!.uid),
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logOut();
    toast.success("Odjavljeni ste");
    router.push("/admin/login");
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#8B5A8E] fill-current" />
            <span className="font-semibold text-gray-800">Digitalne Pozivnice</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
              Odjavi se
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#8B5A8E]">Vaši eventi</h1>
          <Link href="/admin/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novi event
          </Link>
        </div>

        {events?.length === 0 ? (
          <div className="card text-center py-16">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nemate još nijedan event</h3>
            <p className="text-gray-400 mb-6">Kreirajte vaš prvi event i podijelite pozivnicu sa gostima</p>
            <Link href="/admin/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Kreiraj event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events?.map((event) => (
              <div key={event.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{event.coupleNames}</h3>
                    <p className="text-sm text-gray-500">{event.name}</p>
                  </div>
                  <span className={`status-badge text-xs ${event.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"}`}>
                    {event.status === "active" ? "Aktivan" : "Arhiviran"}
                  </span>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-[#8B5A8E]" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-[#8B5A8E]" />
                    {event.location}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={`/admin/${event.id}`} className="btn-primary flex-1 text-center text-sm py-2">
                    Admin panel
                  </Link>
                  <Link href={`/event/${event.id}`} target="_blank" className="btn-secondary flex-1 text-center text-sm py-2 flex items-center justify-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Pozivnica
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
