import { z } from "zod";

export const partyMemberSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dietaryNeeds: z.enum(["omnivore", "vegetarian", "vegan", "glutenfree"]),
});

export const rsvpSchema = z
  .object({
    firstName: z.string().min(2, "Ime mora imati najmanje 2 slova"),
    lastName: z.string().min(2, "Prezime mora imati najmanje 2 slova"),
    email: z.string().email("Nevažeća email adresa").optional().or(z.literal("")),
    phone: z.string().optional(),
    status: z.enum(["confirmed", "declined", "maybe"]),
    partySize: z.number().min(1).max(10),
    dietaryNeeds: z.enum(["omnivore", "vegetarian", "vegan", "glutenfree"]),
    partyMembers: z.array(partyMemberSchema).max(10),
  })
  // Imena članova grupe validiramo samo kad gost dolazi — kad odbije,
  // sekcija je skrivena i ne smije blokirati slanje forme
  .superRefine((data, ctx) => {
    if (data.status !== "confirmed") return;
    data.partyMembers.forEach((m, i) => {
      if (i === 0) return; // osoba 1 = glavni gost, validiran kroz firstName/lastName
      if (m.firstName.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["partyMembers", i, "firstName"],
          message: "Ime mora imati najmanje 2 slova",
        });
      }
      if (m.lastName.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["partyMembers", i, "lastName"],
          message: "Prezime mora imati najmanje 2 slova",
        });
      }
    });
  });

export const eventTimelineSchema = z.object({
  time: z.string(),
  title: z.string().min(1),
  description: z.string(),
});

export const createEventSchema = z.object({
  name: z.string().min(3, "Naziv mora imati najmanje 3 slova"),
  coupleNames: z.string().min(3),
  date: z.string().min(1, "Datum je obavezan"),
  time: z.string().min(1, "Vrijeme je obavezno"),
  endTime: z.string().min(1, "Završno vrijeme je obavezno"),
  location: z.string().min(2, "Lokacija je obavezna"),
  address: z.string().min(5, "Adresa je obavezna"),
  dressCode: z.string().min(2),
  parkingInfo: z.string(),
  eventTimeline: z.array(eventTimelineSchema),
  adminEmail: z.string().email("Nevažeća email adresa"),
  adminPassword: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Nevažeća email adresa"),
  password: z.string().min(1, "Lozinka je obavezna"),
});

export type RSVPFormData = z.infer<typeof rsvpSchema>;
export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
