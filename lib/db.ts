import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Event, Guest, Table, Photo, RSVPStats } from "./types";

// --- Owners ---

// Vlasnik servisa — jedini smije kreirati evente. Dokument owners/{uid}
// se dodaje ručno u Firebase konzoli (vidi SETUP.md)
export async function isOwner(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "owners", uid));
  return snap.exists();
}

// --- Events ---

function mapEvent(id: string, d: Record<string, unknown>): Event {
  return {
    id,
    ...d,
    date: d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date as string),
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(),
  } as Event;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return null;
  return mapEvent(snap.id, snap.data());
}

export async function getEventsByAdmin(adminId: string): Promise<Event[]> {
  // Bez orderBy u upitu — where + orderBy traži composite index u Firestore;
  // sortiramo klijentski da setup radi odmah bez ručnog kreiranja indexa
  const q = query(collection(db, "events"), where("adminId", "==", adminId));
  const snap = await getDocs(q);
  const events = snap.docs.map((d) => mapEvent(d.id, d.data()));
  return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getEventsByOwner(ownerId: string): Promise<Event[]> {
  const q = query(collection(db, "events"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  const events = snap.docs.map((d) => mapEvent(d.id, d.data()));
  return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Vlasnik vidi evente koje je kreirao za klijente + svoje stare evente,
// klijent samo evente kojima je dodijeljen kao admin
export async function getEventsForUser(uid: string, owner: boolean): Promise<Event[]> {
  if (!owner) return getEventsByAdmin(uid);
  const [owned, administered] = await Promise.all([getEventsByOwner(uid), getEventsByAdmin(uid)]);
  const unique = new Map([...owned, ...administered].map((e) => [e.id, e]));
  return [...unique.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createEvent(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "events"), {
    ...data,
    date: Timestamp.fromDate(new Date(data.date)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(eventId: string, data: Partial<Event>): Promise<void> {
  await updateDoc(doc(db, "events", eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// --- Guests ---

export async function getGuests(eventId: string): Promise<Guest[]> {
  const q = query(
    collection(db, "events", eventId, "guests"),
    orderBy("lastName", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapGuest(d.id, d.data()));
}

export function subscribeToGuests(eventId: string, callback: (guests: Guest[]) => void): Unsubscribe {
  const q = query(
    collection(db, "events", eventId, "guests"),
    orderBy("lastName", "asc")
  );
  return onSnapshot(q, (snap) => {
    const guests = snap.docs.map((d) => mapGuest(d.id, d.data()));
    callback(guests);
  });
}

export async function getGuest(eventId: string, guestId: string): Promise<Guest | null> {
  const snap = await getDoc(doc(db, "events", eventId, "guests", guestId));
  if (!snap.exists()) return null;
  return mapGuest(snap.id, snap.data());
}

export async function createGuest(eventId: string, data: Omit<Guest, "id" | "createdAt" | "confirmedAt" | "assignedTable">): Promise<string> {
  const ref = await addDoc(collection(db, "events", eventId, "guests"), {
    ...data,
    assignedTable: null,
    confirmedAt: data.status === "confirmed" ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGuest(eventId: string, guestId: string, data: Partial<Guest>): Promise<void> {
  await updateDoc(doc(db, "events", eventId, "guests", guestId), {
    ...data,
    ...(data.status === "confirmed" ? { confirmedAt: serverTimestamp() } : {}),
  });
}

export async function deleteGuest(eventId: string, guestId: string): Promise<void> {
  await deleteDoc(doc(db, "events", eventId, "guests", guestId));
}

export function computeRSVPStats(guests: Guest[]): RSVPStats {
  const confirmed = guests.filter((g) => g.status === "confirmed");
  const declined = guests.filter((g) => g.status === "declined");
  const maybe = guests.filter((g) => g.status === "maybe");

  const allPeople = confirmed.reduce((sum, g) => sum + (g.partySize || 1), 0);

  const allMembers = confirmed.flatMap((g) => g.partyMembers || []);
  const dietary = {
    omnivore: allMembers.filter((m) => m.dietaryNeeds === "omnivore").length,
    vegetarian: allMembers.filter((m) => m.dietaryNeeds === "vegetarian").length,
    vegan: allMembers.filter((m) => m.dietaryNeeds === "vegan").length,
    glutenfree: allMembers.filter((m) => m.dietaryNeeds === "glutenfree").length,
  };

  return {
    confirmed: confirmed.length,
    declined: declined.length,
    maybe: maybe.length,
    total: guests.length,
    totalPeople: allPeople,
    dietary,
  };
}

export async function getRSVPStats(eventId: string): Promise<RSVPStats> {
  return computeRSVPStats(await getGuests(eventId));
}

// --- Tables ---

export async function getTables(eventId: string): Promise<Table[]> {
  const q = query(collection(db, "events", eventId, "tables"), orderBy("tableNumber", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate() : new Date(),
  })) as Table[];
}

export async function saveTable(eventId: string, tableId: string, data: Omit<Table, "id">): Promise<void> {
  await setDoc(doc(db, "events", eventId, "tables", tableId), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTable(eventId: string, tableId: string): Promise<void> {
  await deleteDoc(doc(db, "events", eventId, "tables", tableId));
}

export async function deleteAllTables(eventId: string): Promise<void> {
  const tables = await getTables(eventId);
  await Promise.all(tables.map((t) => deleteTable(eventId, t.id)));
}

// --- Photos ---

export async function getPhotos(eventId: string, guestId?: string): Promise<Photo[]> {
  const colRef = collection(db, "events", eventId, "photos");
  // where + orderBy bi tražio composite index — filtriramo upitom, sortiramo klijentski
  const q = guestId
    ? query(colRef, where("guestId", "==", guestId))
    : query(colRef, orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  const photos = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    uploadedAt: d.data().uploadedAt instanceof Timestamp ? d.data().uploadedAt.toDate() : new Date(),
  })) as Photo[];
  return guestId ? photos.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()) : photos;
}

export async function addPhoto(eventId: string, data: Omit<Photo, "id" | "uploadedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "events", eventId, "photos"), {
    ...data,
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePhoto(eventId: string, photoId: string): Promise<void> {
  await deleteDoc(doc(db, "events", eventId, "photos", photoId));
}

// --- Helpers ---

function mapGuest(id: string, d: Record<string, unknown>): Guest {
  return {
    id,
    ...(d as Omit<Guest, "id" | "createdAt" | "confirmedAt">),
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    confirmedAt: d.confirmedAt instanceof Timestamp ? d.confirmedAt.toDate() : null,
  } as Guest;
}
