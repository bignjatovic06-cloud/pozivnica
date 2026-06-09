import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Dozvoljeni formati: JPG, PNG, WebP";
  if (file.size > MAX_SIZE) return "Maksimalna veličina fajla je 10MB";
  return null;
}

export function uploadPhoto(
  eventId: string,
  guestId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<{ url: string; storagePath: string }> {
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `events/${eventId}/photos/${guestId}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, storagePath });
      }
    );
  });
}

export async function deletePhotoFromStorage(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}
