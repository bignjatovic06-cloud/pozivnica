"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Save, RotateCcw, Info } from "lucide-react";
import toast from "react-hot-toast";
import { getGuests, getTables, saveTable, deleteTable, deleteAllTables, updateGuest } from "@/lib/db";
import type { Guest, Table, TableType } from "@/lib/types";
import { DIETARY_LABELS } from "@/lib/utils";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { v4 as uuidv4 } from "uuid";

interface Props {
  eventId: string;
}

interface DragState {
  type: "new" | "existing";
  tableType?: TableType;
  capacity?: number;
  tableId?: string;
  offsetX: number;
  offsetY: number;
}

const TABLE_COLORS: Record<string, string> = {
  all_omnivore: "#3b82f6",
  mixed: "#f97316",
  mostly_vegan: "#22c55e",
  has_glutenfree: "#a855f7",
  empty: "#9ca3af",
  stage: "#374151",
  sweetheart: "#ec4899",
};

export default function SeatingChartBuilder({ eventId }: Props) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const [g, t] = await Promise.all([getGuests(eventId), getTables(eventId)]);
      setGuests(g.filter((g) => g.status === "confirmed"));
      setTables(t);
      setLoading(false);
    };
    load();
  }, [eventId]);

  const confirmedGuests = guests;
  const assignedGuestIds = new Set(tables.flatMap((t) => t.assignedGuests));
  const unassignedGuests = confirmedGuests.filter((g) => !assignedGuestIds.has(g.id));

  const getTableColor = (table: Table): string => {
    if (table.type === "stage") return TABLE_COLORS.stage;
    if (table.type === "sweetheart") return TABLE_COLORS.sweetheart;
    if (table.assignedGuests.length === 0) return TABLE_COLORS.empty;

    const members = tables
      .find((t) => t.id === table.id)
      ?.assignedGuests.flatMap((gid) => {
        const g = confirmedGuests.find((x) => x.id === gid);
        return g ? [g, ...(g.partyMembers || [])] : [];
      }) || [];

    const dietary = members.map((m) => ("dietaryNeeds" in m ? m.dietaryNeeds : "omnivore"));
    if (dietary.some((d) => d === "glutenfree")) return TABLE_COLORS.has_glutenfree;
    if (dietary.filter((d) => d === "vegan").length > dietary.length / 2) return TABLE_COLORS.mostly_vegan;
    if (dietary.some((d) => d === "vegan" || d === "vegetarian")) return TABLE_COLORS.mixed;
    return TABLE_COLORS.all_omnivore;
  };

  const getGuestsOnTable = useCallback((table: Table): Guest[] => {
    return table.assignedGuests
      .map((gid) => confirmedGuests.find((g) => g.id === gid))
      .filter(Boolean) as Guest[];
  }, [confirmedGuests]);

  const getPersonCountOnTable = (table: Table): number => {
    return getGuestsOnTable(table).reduce((sum, g) => sum + (g.partySize || 1), 0);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragState || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragState.offsetX;
    const y = e.clientY - rect.top - dragState.offsetY;

    if (dragState.type === "new" && dragState.tableType !== undefined && dragState.capacity !== undefined) {
      const newTable: Table = {
        id: uuidv4(),
        eventId,
        type: dragState.tableType,
        capacity: dragState.capacity,
        tableNumber: tables.length + 1,
        assignedGuests: [],
        notes: "",
        position: { x: Math.max(0, x), y: Math.max(0, y) },
        dietarySummary: { omnivore: 0, vegetarian: 0, vegan: 0, glutenfree: 0 },
        createdAt: new Date(),
      };
      setTables((prev) => [...prev, newTable]);
    } else if (dragState.type === "existing" && dragState.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === dragState.tableId
            ? { ...t, position: { x: Math.max(0, x), y: Math.max(0, y) } }
            : t
        )
      );
    }
    setDragState(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(tables.map((t) => saveTable(eventId, t.id, { ...t, id: undefined } as Omit<Table, "id">)));
      await Promise.all(
        confirmedGuests.map((g) => {
          const table = tables.find((t) => t.assignedGuests.includes(g.id));
          return updateGuest(eventId, g.id, { assignedTable: table?.tableNumber.toString() || null });
        })
      );
      toast.success("Raspored sačuvan!");
    } catch {
      toast.error("Greška pri čuvanju");
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Da li ste sigurni da želite obrisati sve stolove?")) return;
    await deleteAllTables(eventId);
    setTables([]);
    toast.success("Svi stolovi obrisani");
  };

  const assignGuestToTable = (guestId: string, tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const guest = confirmedGuests.find((g) => g.id === guestId);
    if (!guest) return;
    const currentCount = getPersonCountOnTable(table);
    if (currentCount + (guest.partySize || 1) > table.capacity) {
      toast.error(`Stol je popunjen! Kapacitet: ${table.capacity}`);
      return;
    }
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) return { ...t, assignedGuests: [...t.assignedGuests, guestId] };
        return { ...t, assignedGuests: t.assignedGuests.filter((id) => id !== guestId) };
      })
    );
  };

  const removeGuestFromTable = (guestId: string, tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, assignedGuests: t.assignedGuests.filter((id) => id !== guestId) } : t
      )
    );
  };

  const handleDeleteTable = async (tableId: string) => {
    await deleteTable(eventId, tableId);
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setSelectedTable(null);
    toast.success("Stol obrisan");
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  const tableTypes: { type: TableType; label: string; capacities: number[] }[] = [
    { type: "round", label: "Okrugli", capacities: [6, 7, 8, 9, 10] },
    { type: "rectangular", label: "Pravougaoni", capacities: [6, 8, 10, 12] },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] gap-4">
      {/* Panel 1: Tools */}
      <div className="card space-y-4 lg:h-fit">
        <h3 className="font-semibold text-gray-800">Dodaj stolove</h3>
        <p className="text-xs text-gray-500">Prevuci stol na canvas</p>

        {tableTypes.map(({ type, label, capacities }) => (
          <div key={type}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {capacities.map((cap) => (
                <div
                  key={`${type}-${cap}`}
                  draggable
                  onDragStart={(e) => {
                    setDragState({ type: "new", tableType: type, capacity: cap, offsetX: 30, offsetY: 30 });
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className={`flex items-center justify-center p-2 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-600 cursor-grab hover:border-[#8B5A8E] hover:text-[#8B5A8E] hover:bg-purple-50 transition-all select-none`}
                >
                  {cap} os.
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Specijalni</p>
          {[
            { type: "stage" as TableType, label: "🎪 Bina", cap: 0 },
            { type: "sweetheart" as TableType, label: "💍 Mladenci", cap: 2 },
          ].map(({ type, label, cap }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => {
                setDragState({ type: "new", tableType: type, capacity: cap, offsetX: 40, offsetY: 20 });
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="flex items-center justify-center p-2 mb-1.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-600 cursor-grab hover:border-[#8B5A8E] hover:bg-purple-50 transition-all select-none"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Čuvam..." : "Sačuvaj raspored"}
          </button>
          <button onClick={handleClearAll} className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 flex items-center justify-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Obriši sve
          </button>
        </div>
      </div>

      {/* Panel 2: Canvas */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Raspored dvorane</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Omnivore</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Mješano</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Vegan</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Bez glutena</span>
          </div>
        </div>
        <div
          ref={canvasRef}
          className="relative bg-gray-50 overflow-auto"
          style={{ height: "520px", backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Prevuci stolove ovdje</p>
              </div>
            </div>
          )}

          {tables.map((table) => {
            const color = getTableColor(table);
            const personCount = getPersonCountOnTable(table);
            const isFull = personCount >= table.capacity;
            const isRound = table.type === "round";
            const isStage = table.type === "stage";
            const isSweetheart = table.type === "sweetheart";
            const size = isStage ? { w: 120, h: 40 } : isSweetheart ? { w: 80, h: 50 } : { w: 70, h: isRound ? 70 : 55 };

            return (
              <div
                key={table.id}
                draggable
                onDragStart={(e) => {
                  setDragState({ type: "existing", tableId: table.id, offsetX: 35, offsetY: 25 });
                  e.stopPropagation();
                }}
                onClick={() => setSelectedTable(table)}
                className="absolute cursor-move hover:scale-105 transition-transform select-none"
                style={{ left: table.position.x, top: table.position.y, width: size.w }}
                title={`Stol ${table.tableNumber} - ${personCount}/${table.capacity} osoba`}
              >
                <div
                  className={`flex flex-col items-center justify-center text-white text-xs font-semibold shadow-md border-2 border-white/30 ${isRound && !isStage ? "rounded-full" : "rounded-xl"}`}
                  style={{ backgroundColor: color, width: size.w, height: size.h }}
                >
                  {isStage ? "🎪 Bina" : isSweetheart ? "💍" : (
                    <>
                      <span>{table.tableNumber}</span>
                      <span className={`text-[10px] ${isFull ? "text-red-200" : "text-white/80"}`}>{personCount}/{table.capacity}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel 3: Guest list */}
      <div className="card space-y-4 lg:h-fit max-h-[600px] overflow-y-auto">
        <h3 className="font-semibold text-gray-800">Raspored gostiju</h3>

        {unassignedGuests.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Nedodjeljeni ({unassignedGuests.length})
            </p>
            <div className="space-y-1.5">
              {unassignedGuests.map((guest) => (
                <div key={guest.id} className="bg-orange-50 border border-orange-200 rounded-xl p-2">
                  <p className="text-sm font-medium text-gray-800">{guest.lastName} {guest.firstName}</p>
                  <p className="text-xs text-gray-500">{guest.partySize} os. · {DIETARY_LABELS[guest.dietaryNeeds]}</p>
                  {tables.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && assignGuestToTable(guest.id, e.target.value)}
                      className="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-2 py-1"
                      defaultValue=""
                    >
                      <option value="">Dodijeli stol...</option>
                      {tables.filter((t) => t.type !== "stage" && getPersonCountOnTable(t) + guest.partySize <= t.capacity).map((t) => (
                        <option key={t.id} value={t.id}>
                          Stol {t.tableNumber} ({getPersonCountOnTable(t)}/{t.capacity})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tables.filter((t) => t.type !== "stage" && t.assignedGuests.length > 0).map((table) => (
          <div key={table.id}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Stol {table.tableNumber} ({getPersonCountOnTable(table)}/{table.capacity})
            </p>
            <div className="space-y-1">
              {getGuestsOnTable(table).map((guest) => (
                <div key={guest.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-2 py-1.5">
                  <div>
                    <p className="text-xs font-medium">{guest.lastName} {guest.firstName}</p>
                    <p className="text-[10px] text-gray-400">{guest.partySize} os.</p>
                  </div>
                  <button
                    onClick={() => removeGuestFromTable(guest.id, table.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {confirmedGuests.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nema potvrđenih gostiju</p>
          </div>
        )}
      </div>

      {/* Table detail modal */}
      <Modal open={!!selectedTable} onClose={() => setSelectedTable(null)} title={`Stol ${selectedTable?.tableNumber}`} size="md">
        {selectedTable && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tip</p>
                <p className="font-medium capitalize">{selectedTable.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Kapacitet</p>
                <p className="font-medium">{getPersonCountOnTable(selectedTable)}/{selectedTable.capacity} osoba</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Gosti na stolu</p>
              {getGuestsOnTable(selectedTable).length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nema dodijeljenih gostiju</p>
              ) : (
                <div className="space-y-1.5">
                  {getGuestsOnTable(selectedTable).map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{g.lastName} {g.firstName}</p>
                        <p className="text-xs text-gray-400">{g.partySize} os. · {DIETARY_LABELS[g.dietaryNeeds]}</p>
                      </div>
                      <button onClick={() => removeGuestFromTable(g.id, selectedTable.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleDeleteTable(selectedTable.id)}
              className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50"
            >
              Obriši stol
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
