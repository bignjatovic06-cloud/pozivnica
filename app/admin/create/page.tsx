"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Heart, ArrowLeft, RefreshCw, Copy, Check, PartyPopper } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createClientAccount } from "@/lib/auth";
import { createEvent } from "@/lib/db";
import { createEventSchema, type CreateEventFormData } from "@/lib/validation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const DEFAULT_TIMELINE = [
  { time: "18:00", title: "Ceremonija", description: "Vjenčanje i fotografisanje" },
  { time: "19:00", title: "Koktel", description: "Dobrodošlica i aperitiv" },
  { time: "20:00", title: "Večera", description: "Svečana večera" },
  { time: "21:30", title: "Ples", description: "Muzika i ples" },
  { time: "23:30", title: "Kraj", description: "Hvala što ste bili sa nama" },
];

function generatePassword(): string {
  // Bez sličnih znakova (l/1, O/0) — lozinka se diktira klijentu preko telefona
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(10);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

interface CreatedEvent {
  eventId: string;
  email: string;
  password: string;
  coupleNames: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading, isOwner } = useAuth();
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState<CreatedEvent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Evente kreira samo vlasnik servisa — klijenti idu na svoj dashboard
  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/admin/login");
    else if (!isOwner) router.push("/admin/dashboard");
  }, [user, loading, isOwner, router]);

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { eventTimeline: DEFAULT_TIMELINE },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "eventTimeline" });

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      const clientUid = await createClientAccount(data.clientEmail, data.clientPassword);
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
        adminId: clientUid,
        adminEmail: data.clientEmail,
        ownerId: user!.uid,
        status: "active",
      });
      setCreated({ eventId, email: data.clientEmail, password: data.clientPassword, coupleNames: data.coupleNames });
      toast.success("Event kreiran!");
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code;
      if (errorCode === "auth/email-already-in-use" || errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password") {
        toast.error("Email je već registrovan sa drugom lozinkom — koristite drugi email za klijenta.");
      } else {
        toast.error("Greška pri kreiranju eventa");
      }
    }
  };

  const copy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Kopirano!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading || !user || !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Ekran nakon kreiranja — podaci koje vlasnik šalje klijentu
  if (created) {
    const origin = window.location.origin;
    const inviteUrl = `${origin}/event/${created.eventId}`;
    const clientMessage = `Vaša digitalna pozivnica je spremna! 🎉

📨 Link pozivnice — pošaljite ga gostima:
${inviteUrl}

🔐 Admin panel — pratite RSVP, raspored sjedenja i fotografije:
${origin}/admin/login
Email: ${created.email}
Lozinka: ${created.password}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-[#8B5A8E]/10 rounded-full flex items-center justify-center mx-auto">
              <PartyPopper className="w-8 h-8 text-[#8B5A8E]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#8B5A8E]">Pozivnica za {created.coupleNames} je spremna!</h1>
              <p className="text-gray-500 mt-2">Pošaljite klijentu link pozivnice i pristupne podatke za admin panel.</p>
            </div>

            <div className="text-left space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Link pozivnice (za goste)</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 truncate flex-1">{inviteUrl}</span>
                  <button onClick={() => copy(inviteUrl, "url")} className="text-[#8B5A8E] hover:text-[#6d4570] flex-shrink-0">
                    {copiedField === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Pristup admin panelu (za klijenta)</p>
                <div className="space-y-1 text-sm text-gray-800">
                  <p>Prijava: <span className="text-gray-500">{origin}/admin/login</span></p>
                  <p>Email: <strong>{created.email}</strong></p>
                  <div className="flex items-center gap-2">
                    <p>Lozinka: <strong className="font-mono">{created.password}</strong></p>
                    <button onClick={() => copy(created.password, "pass")} className="text-[#8B5A8E] hover:text-[#6d4570]">
                      {copiedField === "pass" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={() => copy(clientMessage, "msg")} className="btn-primary w-full flex items-center justify-center gap-2">
                {copiedField === "msg" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Kopiraj cijelu poruku za klijenta
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
              <p className="text-sm text-amber-800">
                <strong>Važno:</strong> Lozinka se poslije ovog ekrana ne može ponovo vidjeti — kopirajte poruku i pošaljite je klijentu odmah.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/admin/dashboard" className="btn-secondary flex-1 text-center">
                Dashboard
              </Link>
              <Link href={`/admin/${created.eventId}`} className="btn-primary flex-1 text-center">
                Otvori admin panel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#8B5A8E] fill-current" />
            <h1 className="text-2xl font-bold text-[#8B5A8E]">Kreiraj novi event</h1>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 mb-8">
          {["Detalji eventa", "Timeline", "Pristup za klijenta"].map((label, i) => (
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
                  Dalje: Pristup za klijenta →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Client access */}
          {step === 3 && (
            <div className="card space-y-5 animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-800">Pristup za klijenta</h2>
              <p className="text-sm text-gray-500">
                Napravite nalog za mladence — s njim se prijavljuju u admin panel i prate RSVP, raspored sjedenja i fotografije.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email klijenta *</label>
                <input {...register("clientEmail")} type="email" className="input-field" placeholder="mladenci@email.com" />
                {errors.clientEmail && <p className="text-red-500 text-xs mt-1">{errors.clientEmail.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lozinka za klijenta *</label>
                <div className="flex gap-2">
                  <input {...register("clientPassword")} type="text" className="input-field font-mono" placeholder="Najmanje 6 karaktera" />
                  <button
                    type="button"
                    onClick={() => setValue("clientPassword", generatePassword(), { shouldValidate: true })}
                    className="btn-secondary flex items-center gap-2 flex-shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" /> Generiši
                  </button>
                </div>
                {errors.clientPassword && <p className="text-red-500 text-xs mt-1">{errors.clientPassword.message}</p>}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Napomena:</strong> Ove podatke šaljete klijentu nakon kreiranja — na sljedećem ekranu dobijate
                  gotovu poruku sa linkom pozivnice i pristupom.
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
