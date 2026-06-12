import Link from "next/link";
import { Heart, Calendar, Users, Camera, MapPin, Mail, Phone } from "lucide-react";

// Kontakt se mijenja kroz env varijable bez diranja koda (vidi SETUP.md)
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "bignjatovic06@gmail.com";
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8B5A8E]/10 to-[#D4A574]/10" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="flex justify-center mb-6">
            <Heart className="w-12 h-12 text-[#8B5A8E] fill-current" />
          </div>
          <h1 className="text-5xl font-bold text-[#8B5A8E] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
            Digitalne Pozivnice
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Elegantna digitalna pozivnica za vaše vjenčanje — izrađujemo je za vas,
            vi samo pošaljete link gostima.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#kontakt" className="btn-primary text-center inline-block">
              Zatražite pozivnicu
            </a>
            <Link href="/admin/login" className="btn-secondary text-center inline-block">
              Prijava za klijente
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#8B5A8E] text-center mb-12">Šta dobijate uz pozivnicu?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Calendar, title: "RSVP Online", desc: "Gosti potvrđuju dolazak jednim klikom — vi sve pratite uživo" },
            { icon: Users, title: "Raspored sjedenja", desc: "Napravite raspored stolova, svaki gost vidi gdje sjedi" },
            { icon: Camera, title: "Galerija fotografija", desc: "Gosti uploaduju slike sa svadbe — sve na jednom mjestu" },
            { icon: MapPin, title: "Sve informacije", desc: "Lokacija sa mapom, dress code, parking i program večeri" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#8B5A8E]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-[#8B5A8E]" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#8B5A8E] mb-12">Kako funkcioniše?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Javite nam se", desc: "Pošaljete detalje vjenčanja: datum, lokaciju, program i vaše želje" },
              { step: "2", title: "Mi izradimo pozivnicu", desc: "Dobijete link pozivnice i vlastiti pristup admin panelu" },
              { step: "3", title: "Šaljete link gostima", desc: "Jedan link na Viber/WhatsApp — RSVP odgovore pratite uživo" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#8B5A8E] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="kontakt" className="py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#8B5A8E] mb-4">Zatražite vašu pozivnicu</h2>
          <p className="text-gray-600 mb-8">
            Javite nam se sa detaljima vjenčanja — pozivnicu izrađujemo u dogovoru s vama
            i šaljemo vam link spreman za goste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Upit za digitalnu pozivnicu")}`}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
            </a>
            {CONTACT_PHONE && (
              <a href={`tel:${CONTACT_PHONE}`} className="btn-secondary inline-flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> {CONTACT_PHONE}
              </a>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>Digitalne Pozivnice</span>
          <Link href="/admin/login" className="hover:text-[#8B5A8E]">
            Admin prijava
          </Link>
        </div>
      </footer>
    </main>
  );
}
