# Setup upute

## 1. Firebase projekt (Auth + Firestore — besplatno, bez kartice)

1. Idi na https://console.firebase.google.com
2. Klikni "Add project", unesi naziv
3. U projektu idi na **Build > Firestore Database** → Create database (Standard edition, Production mode, region `europe-west1` ili `eur3`)
4. Idi na **Build > Authentication** → Get started → Enable **Email/Password** provider
5. Idi na **Project Settings** (ikona zupčanika) → **General** → **Your apps** → Dodaj Web app (`</>`)
6. Kopiraj Firebase config vrijednosti

## 2. Cloudinary (slike — besplatno 25GB, bez kartice)

1. Idi na https://cloudinary.com → Sign up free
2. Na dashboardu kopiraj **Cloud name**
3. **Settings → Upload → Upload presets → Add upload preset**:
   - Preset name: `pozivnica_upload`
   - Signing mode: **Unsigned**
   - Save
4. **Settings → API Keys** → kopiraj **API Key** i **API Secret**

## 3. Environment varijable

Kreiraj `.env.local` u root folderu (kopiraj iz `.env.example`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pozivnica_upload
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Kontakt na landing stranici (opciono)
NEXT_PUBLIC_CONTACT_EMAIL=...
NEXT_PUBLIC_CONTACT_PHONE=...
```

## 4. Firestore Security Rules

U Firebase Console → **Firestore Database → Rules**, zalijepiti sadržaj fajla `firestore.rules` → **Publish**.

## 4a. Tvoj vlasnički nalog (jednokratno)

Samo vlasnik servisa (ti) smije kreirati evente. Postavljanje:

1. Firebase Console → **Authentication → Users → Add user** → unesi svoj email i lozinku
2. Kopiraj **User UID** novog korisnika (kolona UID u tabeli)
3. Firestore Database → **Start collection** → Collection ID: `owners`
4. Document ID: zalijepi svoj UID → dodaj polje `email` (string) sa tvojim emailom → **Save**
5. Prijavi se na `/admin/login` — sada na dashboardu imaš dugme **"Novi event"**

> Klijenti (mladenci) NE prave naloge sami — ti im kreiraš nalog pri izradi eventa.

## 5. Vercel deployment

1. Push kod na GitHub
2. Idi na https://vercel.com → New Project → Import GitHub repo
3. U **Environment Variables** unesi SVE varijable iz `.env.local`
4. Deploy!

## 6. Korištenje aplikacije

### Ti (vlasnik) kreiraš event za klijenta:
1. Prijavi se na `/admin/login` → dashboard → **"Novi event"**
2. Popuni detalje vjenčanja (3 koraka) — u 3. koraku uneseš **email i lozinku za klijenta**
   (dugme "Generiši" pravi sigurnu lozinku)
3. Na završnom ekranu dobiješ gotovu poruku: link pozivnice + pristupne podatke
   → **"Kopiraj cijelu poruku za klijenta"** i pošalji mladencima na Viber/WhatsApp
4. Lozinka se poslije tog ekrana ne može ponovo vidjeti — pošalji je odmah

### Klijent (mladenci) dobija od tebe:
1. **Link pozivnice** `https://vas-domen.vercel.app/event/{eventId}` — šalje ga gostima
2. **Pristup admin panelu** — prijava na `/admin/login`, vidi samo svoj event:
   - **RSVP tab**: Filteri Potvrđeni / Nije siguran / Ne dolaze, export CSV
   - **Seating Chart**: Drag & drop raspored sjedenja (klikni "Sačuvaj raspored" kad završiš!)
   - **Fotografije**: Sve fotografije gostiju

### Gost prima pozivnicu:
1. Klikne na link
2. Vidi 4 taba: Info / RSVP / Slike / Moj stol
3. Popuni RSVP (jednom — čuva se u njegovom browseru)
4. Uploaduje fotografije
5. Kada se napravi raspored → vidi svoj stol

## Poznata ograničenja (v1)

- Gost se identifikuje preko browsera (localStorage) — ako obriše historiju ili promijeni uređaj, ne vidi svoj postojeći RSVP (može poslati novi, admin briše duplikat)
- Isti gost može teoretski poslati više RSVP-ova — admin vidi duplikate u tabeli i briše ih
- Brisanje slika nije zaštićeno autentifikacijom gostiju (gostima nije potreban login)
