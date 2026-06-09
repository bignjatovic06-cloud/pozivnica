"use client";

import { useState, useEffect } from "react";
import { Search, Download, Trash2, Edit2, ChevronDown, Users, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { subscribeToGuests, deleteGuest, getRSVPStats, updateGuest } from "@/lib/db";
import type { Guest, RSVPStats } from "@/lib/types";
import { DIETARY_LABELS, STATUS_LABELS, STATUS_COLORS, formatDateTime } from "@/lib/utils";
import Modal from "@/components/common/Modal";
import LoadingSpinner from "@/components/common/LoadingSpinner";

type Filter = "all" | "confirmed" | "maybe" | "declined";

interface Props {
  eventId: string;
}

export default function RSVPManagement({ eventId }: Props) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<RSVPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToGuests(eventId, async (g) => {
      setGuests(g);
      setLoading(false);
      const s = await getRSVPStats(eventId);
      setStats(s);
    });
    return unsub;
  }, [eventId]);

  const filtered = guests.filter((g) => {
    const matchesFilter = filter === "all" || g.status === filter;
    const matchesSearch = search === "" ||
      g.lastName.toLowerCase().includes(search.toLowerCase()) ||
      g.firstName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (guestId: string) => {
    try {
      await deleteGuest(eventId, guestId);
      toast.success("Gost obrisan");
      setDeleteConfirm(null);
      setSelectedGuest(null);
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  const handleStatusChange = async (guestId: string, status: Guest["status"]) => {
    try {
      await updateGuest(eventId, guestId, { status });
      toast.success("Status ažuriran");
    } catch {
      toast.error("Greška pri ažuriranju");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Prezime", "Ime", "Email", "Status", "Broj osoba", "Dijetalne potrebe", "Stol"],
      ...filtered.map((g) => [
        g.lastName,
        g.firstName,
        g.email || "",
        STATUS_LABELS[g.status],
        g.partySize.toString(),
        DIETARY_LABELS[g.dietaryNeeds],
        g.assignedTable || "Nije dodijeljen",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp_lista.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV preuzet");
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  const filterOptions: { id: Filter; label: string; icon: typeof CheckCircle; count: number }[] = [
    { id: "all", label: "Svi", icon: Users, count: stats?.total || 0 },
    { id: "confirmed", label: "Potvrđeni", icon: CheckCircle, count: stats?.confirmed || 0 },
    { id: "maybe", label: "Nije siguran", icon: HelpCircle, count: stats?.maybe || 0 },
    { id: "declined", label: "Ne dolaze", icon: XCircle, count: stats?.declined || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-500 mt-1">Potvrđeni</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-yellow-500">{stats.maybe}</p>
            <p className="text-sm text-gray-500 mt-1">Nije siguran</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-red-500">{stats.declined}</p>
            <p className="text-sm text-gray-500 mt-1">Ne dolaze</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-[#8B5A8E]">{stats.totalPeople}</p>
            <p className="text-sm text-gray-500 mt-1">Ukupno osoba</p>
          </div>
        </div>
      )}

      {/* Dietary breakdown */}
      {stats && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">Dijetalne preferencije (potvrđeni)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.dietary).map(([key, val]) => (
              <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#8B5A8E]">{val}</p>
                <p className="text-xs text-gray-500">{DIETARY_LABELS[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 flex-wrap">
          {filterOptions.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === id ? "bg-[#8B5A8E] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === id ? "bg-white/20" : "bg-gray-100"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži..."
              className="input-field pl-9 py-2 text-sm w-44"
            />
          </div>
          <button onClick={exportCSV} className="btn-secondary py-2 text-sm flex items-center gap-1.5">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nema gostiju u ovoj kategoriji</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prezime / Ime</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Osoba</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dijetalne</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Stol</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((guest) => (
                  <tr
                    key={guest.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedGuest(guest)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-800">{guest.lastName} {guest.firstName}</p>
                        {guest.email && <p className="text-xs text-gray-400">{guest.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`status-badge ${STATUS_COLORS[guest.status]}`}>
                        {STATUS_LABELS[guest.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{guest.partySize}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">{DIETARY_LABELS[guest.dietaryNeeds]}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-sm ${guest.assignedTable ? "text-[#8B5A8E] font-medium" : "text-gray-400"}`}>
                        {guest.assignedTable ? `Stol ${guest.assignedTable}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setSelectedGuest(guest)} className="p-1.5 rounded-lg hover:bg-gray-100">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(guest.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guest detail modal */}
      <Modal open={!!selectedGuest} onClose={() => setSelectedGuest(null)} title="Detalji gosta" size="md">
        {selectedGuest && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Prezime i ime</p>
                <p className="font-semibold text-gray-800">{selectedGuest.lastName} {selectedGuest.firstName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`status-badge ${STATUS_COLORS[selectedGuest.status]}`}>
                  {STATUS_LABELS[selectedGuest.status]}
                </span>
              </div>
              {selectedGuest.email && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-700">{selectedGuest.email}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Broj osoba</p>
                <p className="text-sm text-gray-700">{selectedGuest.partySize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Odgovoreno</p>
                <p className="text-sm text-gray-700">{selectedGuest.createdAt ? formatDateTime(selectedGuest.createdAt) : "—"}</p>
              </div>
            </div>

            {selectedGuest.partyMembers?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Osobe u grupi</p>
                <div className="space-y-2">
                  {selectedGuest.partyMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                      <span className="text-sm font-medium">{m.lastName} {m.firstName}</span>
                      <span className="text-xs text-gray-500">{DIETARY_LABELS[m.dietaryNeeds]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-2">Promijeni status</p>
              <div className="flex gap-2">
                {(["confirmed", "maybe", "declined"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selectedGuest.id, s)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      selectedGuest.status === s
                        ? STATUS_COLORS[s] + " border-transparent"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setDeleteConfirm(selectedGuest.id)}
              className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors"
            >
              Obriši gosta
            </button>
          </div>
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Potvrdi brisanje" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">Da li ste sigurni da želite obrisati ovog gosta? Ova akcija se ne može poništiti.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Odustani</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger flex-1">Obriši</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
