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
```

## 4. Firestore Security Rules

U Firebase Console → **Firestore Database → Rules**, zalijepiti sadržaj fajla `firestore.rules` → **Publish**.

## 5. Vercel deployment

1. Push kod na GitHub
2. Idi na https://vercel.com → New Project → Import GitHub repo
3. U **Environment Variables** unesi SVE varijable iz `.env.local`
4. Deploy!

## 6. Korištenje aplikacije

### Admin kreira event:
1. Idi na `/admin/create`
2. Popuni detalje vjenčanja (3 koraka)
3. Dobiješ URL eventa: `https://vas-domen.vercel.app/event/{eventId}`
4. Pošalji taj link svim gostima (Viber, WhatsApp, SMS)

### Gost prima pozivnicu:
1. Klikne na link
2. Vidi 4 taba: Info / RSVP / Slike / Moj stol
3. Popuni RSVP (jednom — čuva se u njegovom browseru)
4. Uploaduje fotografije
5. Kada admin napravi raspored → vidi svoj stol

### Admin prati RSVP:
1. Loguj se na `/admin/login`
2. Vidi sve evente na `/admin/dashboard`
3. Klikni na event za admin panel:
   - **RSVP tab**: Filteri Potvrđeni / Nije siguran / Ne dolaze, export CSV
   - **Seating Chart**: Drag & drop raspored sjedenja (klikni "Sačuvaj raspored" kad završiš!)
   - **Fotografije**: Sve fotografije gostiju

## Poznata ograničenja (v1)

- Gost se identifikuje preko browsera (localStorage) — ako obriše historiju ili promijeni uređaj, ne vidi svoj postojeći RSVP (može poslati novi, admin briše duplikat)
- Isti gost može teoretski poslati više RSVP-ova — admin vidi duplikate u tabeli i briše ih
- Brisanje slika nije zaštićeno autentifikacijom gostiju (gostima nije potreban login)
