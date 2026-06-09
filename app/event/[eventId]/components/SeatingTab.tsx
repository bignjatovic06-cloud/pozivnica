"use client";

import { useState, useEffect } from "react";
import { Armchair, Clock, Users } from "lucide-react";
import { getGuest, getTables } from "@/lib/db";
import type { Guest, Table } from "@/lib/types";
import { DIETARY_LABELS, formatDateTime } from "@/lib/utils";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface Props {
  eventId: string;
  guestId: string | null;
}

export default function SeatingTab({ eventId, guestId }: Props) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (guestId) {
        const [g, t] = await Promise.all([getGuest(eventId, guestId), getTables(eventId)]);
        setGuest(g);
        setTables(t);
      }
      setLoading(false);
    };
    load();
  }, [eventId, guestId]);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  if (!guestId || !guest) {
    return (
      <div className="card text-center py-12 animate-fadeIn">
        <Armchair className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Popunite RSVP prvo</h3>
        <p className="text-gray-400 text-sm">Kada potvrdite dolazak, admin će vam dodijeliti stol.</p>
      </div>
    );
  }

  if (guest.status !== "confirmed") {
    return (
      <div className="card text-center py-12 animate-fadeIn">
        <Armchair className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Raspored sjedenja</h3>
        <p className="text-gray-400 text-sm">Raspored sjedenja je dostupan samo za goste koji su potvrdili dolazak.</p>
      </div>
    );
  }

  const assignedTable = tables.find((t) => t.tableNumber.toString() === guest.assignedTable);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Table assignment */}
      <div className="card text-center">
        {!guest.assignedTable ? (
          <>
            <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Raspored se priprema</h2>
            <p className="text-gray-500 text-sm">Admin još nije napravio raspored sjedenja. Provjerite ponovo bliže datumu eventi.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-[#8B5A8E] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-bold">{guest.assignedTable}</span>
            </div>
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Vaš stol</p>
            <h2 className="text-3xl font-bold text-[#8B5A8E] mb-1">STOL {guest.assignedTable}</h2>
            {assignedTable && (
              <p className="text-sm text-gray-500">
                {assignedTable.type === "round" ? "Okrugli stol" : "Pravougaoni stol"} · {assignedTable.capacity} mjesta
              </p>
            )}
          </>
        )}
      </div>

      {/* Party members */}
      {guest.partyMembers?.length > 0 && guest.assignedTable && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#8B5A8E]" />
            <h3 className="font-semibold text-gray-800">Vaša grupa na stolu</h3>
          </div>
          <div className="space-y-2">
            {guest.partyMembers.map((member, i) => (
              <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#8B5A8E]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#8B5A8E]">
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {member.lastName} {member.firstName}
                      {i === 0 && <span className="ml-2 text-xs text-[#8B5A8E]">(Vi)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{DIETARY_LABELS[member.dietaryNeeds]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dietary summary */}
      {guest.assignedTable && assignedTable && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Dijetalne preferencije na stolu</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(assignedTable.dietarySummary || {}).map(([key, val]) => (
              val > 0 && (
                <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-[#8B5A8E]">{val}</p>
                  <p className="text-xs text-gray-500">{DIETARY_LABELS[key]}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Hall map */}
      {tables.length > 0 && guest.assignedTable && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Mapa dvorane</h3>
          <div
            className="relative bg-gray-50 rounded-xl overflow-hidden"
            style={{
              height: "320px",
              backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {tables.map((table) => {
              const isMyTable = table.tableNumber.toString() === guest.assignedTable;
              const isRound = table.type === "round";
              const isStage = table.type === "stage";

              const size = isStage ? { w: 80, h: 28 } : { w: 48, h: isRound ? 48 : 38 };

              return (
                <div
                  key={table.id}
                  className="absolute"
                  style={{ left: Math.min(table.position.x, 650), top: Math.min(table.position.y, 270), width: size.w }}
                  title={`Stol ${table.tableNumber}`}
                >
                  <div
                    className={`flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 transition-all ${
                      isRound && !isStage ? "rounded-full" : "rounded-lg"
                    } ${isMyTable ? "border-white ring-2 ring-green-400 scale-125" : "border-white/30 opacity-70"}`}
                    style={{
                      backgroundColor: isStage ? "#374151" : isMyTable ? "#22c55e" : "#8B5A8E",
                      width: size.w,
                      height: size.h,
                    }}
                  >
                    {isStage ? "🎪" : table.tableNumber}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Vaš stol
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#8B5A8E] inline-block" /> Ostali stolovi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-700 inline-block" /> Bina
            </span>
          </div>
        </div>
      )}

      {guest.confirmedAt && (
        <p className="text-center text-xs text-gray-400">
          Potvrđeno: {formatDateTime(guest.confirmedAt)}
        </p>
      )}
    </div>
  );
}
