export type RSVPStatus = "confirmed" | "declined" | "maybe";
export type DietaryNeed = "omnivore" | "vegetarian" | "vegan" | "glutenfree";
export type TableType = "round" | "rectangular" | "sweetheart" | "stage";
export type EventStatus = "draft" | "active" | "completed";

export interface PartyMember {
  id: string;
  firstName: string;
  lastName: string;
  dietaryNeeds: DietaryNeed;
}

export interface Guest {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: RSVPStatus;
  partySize: number;
  dietaryNeeds: DietaryNeed;
  partyMembers: PartyMember[];
  assignedTable: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface EventTimeline {
  time: string;
  title: string;
  description: string;
}

export interface Event {
  id: string;
  name: string;
  coupleNames: string;
  date: Date;
  time: string;
  endTime: string;
  location: string;
  address: string;
  dressCode: string;
  parkingInfo: string;
  eventTimeline: EventTimeline[];
  adminId: string;
  adminEmail: string;
  createdAt: Date;
  updatedAt: Date;
  status: EventStatus;
  coverImage?: string;
}

export interface DietarySummary {
  omnivore: number;
  vegetarian: number;
  vegan: number;
  glutenfree: number;
}

export interface TablePosition {
  x: number;
  y: number;
}

export interface Table {
  id: string;
  eventId: string;
  type: TableType;
  capacity: number;
  tableNumber: number;
  assignedGuests: string[];
  notes: string;
  position: TablePosition;
  dietarySummary: DietarySummary;
  createdAt: Date;
}

export interface Photo {
  id: string;
  eventId: string;
  guestId: string;
  url: string;
  storagePath: string;
  uploadedAt: Date;
  fileName: string;
  guestLastName: string;
  guestFirstName: string;
  fileSize: number;
}

export interface RSVPStats {
  confirmed: number;
  declined: number;
  maybe: number;
  total: number;
  totalPeople: number;
  dietary: DietarySummary;
}
