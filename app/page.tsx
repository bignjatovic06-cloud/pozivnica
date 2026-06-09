import Link from "next/link";
import { Heart, Calendar, Users, Camera, MapPin } from "lucide-react";

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
            Elegantne digitalne pozivnice sa RSVP upravljanjem, rasporedom sjedenja i photo gallerijom.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin/create" className="btn-primary text-center inline-block">
              Kreiraj event
            </Link>
            <Link href="/admin/login" className="btn-secondary text-center inline-block">
              Admin prijava
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Calendar, title: "RSVP Online", desc: "Gosti potvrđuju dolazak direktno na telefonu" },
            { icon: Users, title: "Seating Chart", desc: "Drag & drop raspored sjedenja za sve goste" },
            { icon: Camera, title: "Photo Gallery", desc: "Gosti uploađuju slike, vi imate sve na jednom mjestu" },
            { icon: MapPin, title: "Event Info", desc: "Sve informacije: lokacija, dress code, parking, timeline" },
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
              { step: "1", title: "Kreiraš event", desc: "Uneseš detalje vjenčanja i dobijaš link za goste" },
              { step: "2", title: "Šalješ link", desc: "Kopiraš jedan link i šalješ svim gostima na Viber/WhatsApp" },
              { step: "3", title: "Pratiš RSVP", desc: "Admin panel se ažurira u realnom vremenu kako gosti odgovaraju" },
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
    </main>
  );
}
