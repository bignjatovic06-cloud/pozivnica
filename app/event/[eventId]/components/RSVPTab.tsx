"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { rsvpSchema, type RSVPFormData } from "@/lib/validation";
import { createGuest, getGuest } from "@/lib/db";
import { DIETARY_LABELS } from "@/lib/utils";
import type { Guest } from "@/lib/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface Props {
  eventId: string;
  guestId: string | null;
  onComplete: (guestId: string) => void;
}

const DEFAULT_MEMBER = { id: crypto.randomUUID(), firstName: "", lastName: "", dietaryNeeds: "omnivore" as const };

export default function RSVPTab({ eventId, guestId, onComplete }: Props) {
  const [existingGuest, setExistingGuest] = useState<Guest | null>(null);
  const [loadingGuest, setLoadingGuest] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, watch, control, setValue, formState: { errors, isSubmitting } } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      status: "confirmed",
      partySize: 1,
      dietaryNeeds: "omnivore",
      partyMembers: [{ ...DEFAULT_MEMBER }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "partyMembers" });
  const partySize = watch("partySize");
  const status = watch("status");

  useEffect(() => {
    const load = async () => {
      if (guestId) {
        const g = await getGuest(eventId, guestId);
        setExistingGuest(g);
      }
      setLoadingGuest(false);
    };
    load();
  }, [eventId, guestId]);

  useEffect(() => {
    const current = fields.length;
    if (partySize > current) {
      for (let i = current; i < partySize; i++) {
        append({ id: crypto.randomUUID(), firstName: "", lastName: "", dietaryNeeds: "omnivore" });
      }
    } else if (partySize < current && current > 1) {
      for (let i = current; i > partySize; i--) remove(i - 1);
    }
  }, [partySize, fields.length, append, remove]);

  const onSubmit = async (data: RSVPFormData) => {
    try {
      const newGuestId = await createGuest(eventId, {
        eventId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || "",
        phone: data.phone || "",
        status: data.status,
        partySize: data.partySize,
        dietaryNeeds: data.dietaryNeeds,
        partyMembers: data.partyMembers,
      });
      setSubmitted(true);
      toast.success("RSVP uspješno poslan!");
      setTimeout(() => onComplete(newGuestId), 1500);
    } catch {
      toast.error("Greška pri slanju RSVP-a");
    }
  };

  if (loadingGuest) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  if (submitted || existingGuest) {
    return (
      <div className="card text-center py-10 animate-fadeIn">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {existingGuest ? "Već ste odgovorili!" : "Hvala na odgovoru!"}
        </h2>
        <p className="text-gray-500 mb-2">
          {existingGuest
            ? `Vaš status: ${existingGuest.status === "confirmed" ? "✅ Dolazim" : existingGuest.status === "declined" ? "❌ Ne dolazim" : "⏳ Nisam siguran"}`
            : "Vaš RSVP je uspješno zabilježen."}
        </p>
        {existingGuest?.status === "confirmed" && (
          <p className="text-sm text-gray-400">Kada admin napravi raspored sjedenja, vidjet ćete vaš stol na tabi "Moj stol"</p>
        )}
        {existingGuest && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-gray-600 mb-2">Vaši podaci:</p>
            <p className="text-sm text-gray-700">{existingGuest.lastName} {existingGuest.firstName}</p>
            <p className="text-sm text-gray-500">{existingGuest.partySize} osoba · {DIETARY_LABELS[existingGuest.dietaryNeeds]}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fadeIn">
      {/* Main guest info */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-[#8B5A8E]">Vaši podaci</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ime *</label>
            <input {...register("firstName")} className="input-field" placeholder="Ana" />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prezime *</label>
            <input {...register("lastName")} className="input-field" placeholder="Horvat" />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (opciono)</label>
          <input {...register("email")} type="email" className="input-field" placeholder="vasa@email.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dolazite? *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "confirmed", label: "✅ Da, dolazim" },
              { value: "declined", label: "❌ Ne mogu" },
              { value: "maybe", label: "🤔 Nisam siguran" },
            ].map(({ value, label }) => (
              <label
                key={value}
                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium text-center ${
                  status === value
                    ? "border-[#8B5A8E] bg-[#8B5A8E]/10 text-[#8B5A8E]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input {...register("status")} type="radio" value={value} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Party size + members - only if confirmed */}
      {status === "confirmed" && (
        <>
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-3">Koliko osoba dolazi (uključujući vas)?</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue("partySize", n)}
                  className={`w-12 h-12 rounded-xl font-semibold border-2 transition-all ${
                    partySize === n
                      ? "border-[#8B5A8E] bg-[#8B5A8E] text-white"
                      : "border-gray-200 text-gray-700 hover:border-[#8B5A8E]"
                  }`}
                >
                  {n}
                </button>
              ))}
              {partySize > 5 && (
                <input
                  {...register("partySize", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={10}
                  className="input-field w-20"
                />
              )}
            </div>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {index === 0 ? "Vi" : `Osoba ${index + 1}`}
                  </h3>
                  {index > 0 && (
                    <button type="button" onClick={() => { remove(index); setValue("partySize", partySize - 1); }} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ime</label>
                    <input {...register(`partyMembers.${index}.firstName`)} className="input-field text-sm" placeholder="Ime" />
                    {errors.partyMembers?.[index]?.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.partyMembers[index]?.firstName?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prezime</label>
                    <input {...register(`partyMembers.${index}.lastName`)} className="input-field text-sm" placeholder="Prezime" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Dijetalne preferencije</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(DIETARY_LABELS).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          {...register(`partyMembers.${index}.dietaryNeeds`)}
                          type="radio"
                          value={value}
                          className="accent-[#8B5A8E]"
                        />
                        <span className="text-xs text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {partySize < 10 && (
              <button
                type="button"
                onClick={() => { setValue("partySize", partySize + 1); }}
                className="flex items-center gap-2 text-[#8B5A8E] text-sm font-medium hover:underline w-full justify-center py-2"
              >
                <Plus className="w-4 h-4" /> Dodaj osobu
              </button>
            )}
          </div>
        </>
      )}

      {/* Dietary for main guest if not showing party members */}
      {status !== "confirmed" && (
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">Vaše dijetalne preferencije</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DIETARY_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input {...register("dietaryNeeds")} type="radio" value={value} className="accent-[#8B5A8E]" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
        {isSubmitting ? <><LoadingSpinner size="sm" /> Šaljem...</> : "Pošalji RSVP"}
      </button>
    </form>
  );
}
