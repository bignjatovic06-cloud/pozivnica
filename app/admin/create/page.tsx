"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { signUp } from "@/lib/auth";
import { createEvent } from "@/lib/db";
import { createEventSchema, type CreateEventFormData } from "@/lib/validation";

const DEFAULT_TIMELINE = [
  { time: "18:00", title: "Ceremonija", description: "Vjenčanje i fotografisanje" },
  { time: "19:00", title: "Koktel", description: "Dobrodošlica i aperitiv" },
  { time: "20:00", title: "Večera", description: "Svečana večera" },
  { time: "21:30", title: "Ples", description: "Muzika i ples" },
  { time: "23:30", title: "Kraj", description: "Hvala što ste bili sa nama" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { eventTimeline: DEFAULT_TIMELINE },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "eventTimeline" });

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      const user = await signUp(data.adminEmail, data.adminPassword);
      const eventId = await createEvent({
        name: data.name,
        coupleNames: data.coupleNames,
        date: new Date(data.date),
        time: data.time,
        endTime: data.endTime,
        location: data.location,
        address: data.address,
        dressCode: data.dressCode,
        parkingInfo: data.parkingInfo,
        eventTimeline: data.eventTimeline,
        adminId: user.uid,
        adminEmail: data.adminEmail,
        status: "active",
      });
      toast.success("Event uspješno kreiran!");
      router.push(`/admin/${eventId}`);
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code;
      if (errorCode === "auth/email-already-in-use") {
        toast.error("Email je već registrovan. Prijavite se.");
        router.push("/admin/login");
      } else {
        toast.error("Greška pri kreiranju eventa");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-lg hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#8B5A8E] fill-current" />
            <h1 className="text-2xl font-bold text-[#8B5A8E]">Kreiraj novi event</h1>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 mb-8">
          {["Detalji eventa", "Timeline", "Vaš račun"].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-2 rounded-full transition-colors ${step > i ? "bg-[#8B5A8E]" : "bg-gray-200"}`} />
              <p className={`text-xs mt-1 text-center ${step === i + 1 ? "text-[#8B5A8E] font-medium" : "text-gray-400"}`}>{label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="card space-y-5 animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-800">Detalji vjenčanja</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Naziv eventa *</label>
                  <input {...register("name")} className="input-field" placeholder="Vjenčanje Ane i Marka" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imena mladenaca *</label>
                  <input {...register("coupleNames")} className="input-field" placeholder="Ana & Marko" />
                  {errors.coupleNames && <p className="text-red-500 text-xs mt-1">{errors.coupleNames.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datum *</label>
                  <input {...register("date")} type="date" className="input-field" />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Početak *</label>
                    <input {...register("time")} type="time" className="input-field" defaultValue="18:00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kraj *</label>
                    <input {...register("endTime")} type="time" className="input-field" defaultValue="23:30" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lokacija *</label>
                  <input {...register("location")} className="input-field" placeholder="Hotel Palace" />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresa *</label>
                  <input {...register("address")} className="input-field" placeholder="Ul. Kralja Petra 1, Sarajevo" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dress code *</label>
                  <input {...register("dressCode")} className="input-field" placeholder="Svečano / Cocktail" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parking info</label>
                  <input {...register("parkingInfo")} className="input-field" placeholder="Besplatno parkiranje ispred hotela" />
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">
                Dalje: Timeline →
              </button>
            </div>
          )}

          {/* Step 2: Timeline */}
          {step === 2 && (
            <div className="card space-y-5 animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-800">Program eventa</h2>
              <p className="text-sm text-gray-500">Dodajte tačke programa koje će gosti vidjeti na pozivnici</p>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl">
                    <input
                      {...register(`eventTimeline.${index}.time`)}
                      type="time"
                      className="input-field w-28 flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        {...register(`eventTimeline.${index}.title`)}
                        className="input-field"
                        placeholder="Naziv (npr. Ceremonija)"
                      />
                      <input
                        {...register(`eventTimeline.${index}.description`)}
                        className="input-field"
                        placeholder="Opis (opciono)"
                      />
                    </div>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:text-red-600 mt-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => append({ time: "20:00", title: "", description: "" })}
                className="flex items-center gap-2 text-[#8B5A8E] text-sm font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Dodaj tačku programa
              </button>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  ← Nazad
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                  Dalje: Vaš račun →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Account */}
          {step === 3 && (
            <div className="card space-y-5 animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-800">Kreirajte vaš admin račun</h2>
              <p className="text-sm text-gray-500">Koristićete ove podatke za pristup admin panelu</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email adresa *</label>
                <input {...register("adminEmail")} type="email" className="input-field" placeholder="vasa@email.com" />
                {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lozinka *</label>
                <input {...register("adminPassword")} type="password" className="input-field" placeholder="Najmanje 6 karaktera" />
                {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword.message}</p>}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Napomena:</strong> Zapamtite ove podatke — koristite ih svaki put kad se prijavite u admin panel.
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                  ← Nazad
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? "Kreiranje..." : "Kreiraj event 🎉"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
