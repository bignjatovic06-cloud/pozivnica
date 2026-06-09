# Setup upute

## 1. Firebase projekt

1. Idi na https://console.firebase.google.com
2. Klikni "Add project", unesi naziv
3. U projektu idi na **Build > Firestore Database** → Kreiraj (Production mode)
4. Idi na **Build > Authentication** → Enable **Email/Password** provider
5. Idi na **Build > Storage** → Kreiraj bucket
6. Idi na **Project Settings** (ikona zupčanika) → **General** → **Your apps** → Dodaj Web app
7. Kopiraj Firebase config

## 2. Environment varijable

Kreiraj `.env.local` u root folderu:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 3. Firebase Security Rules

U Firebase Console → **Firestore Database → Rules**, zalijepiti sadržaj fajla `firestore.rules`.
U Firebase Console → **Storage → Rules**, zalijepiti sadržaj fajla `storage.rules`.

## 4. Vercel deployment

1. Push kod na GitHub
2. Idi na https://vercel.com → New Project → Import GitHub repo
3. U **Environment Variables** unesi sve NEXT_PUBLIC_FIREBASE_* varijable
4. Deploy!

## 5. Korištenje aplikacije

### Admin kreira event:
1. Idi na `/admin/create`
2. Popuni detalje vjenčanja (3 koraka)
3. Dobijete URL eventa: `https://vas-domen.vercel.app/event/{eventId}`
4. Pošalji taj link svim gostima (Viber, WhatsApp, SMS)

### Gost prima pozivnicu:
1. Klikne na link
2. Vidi 4 taba: Info / RSVP / Slike / Moj stol
3. Popuni RSVP (jednom - čuva se lokalno)
4. Uploaduje fotografije
5. Kada admin napravi raspored → vidi svoj stol

### Admin prati RSVP:
1. Loguj se na `/admin/login`
2. Vidi sve evente na `/admin/dashboard`
3. Klikni na event za admin panel:
   - **RSVP tab**: Filteri Potvrđeni / Nije siguran / Ne dolaze, export CSV
   - **Seating Chart**: Drag & drop raspored sjedenja
   - **Fotografije**: Sve fotografije gostiju
