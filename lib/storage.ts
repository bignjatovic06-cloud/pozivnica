const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Dozvoljeni formati: JPG, PNG, WebP";
  if (file.size > MAX_SIZE) return "Maksimalna veličina fajla je 10MB";
  return null;
}

export async function uploadPhoto(
  eventId: string,
  guestId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<{ url: string; storagePath: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `pozivnica/${eventId}/${guestId}`);

  // Cloudinary doesn't support progress natively via fetch, simulate it
  onProgress(10);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  onProgress(90);

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Upload failed");
  }

  const data = await response.json();
  onProgress(100);

  return {
    url: data.secure_url,
    storagePath: data.public_id, // Cloudinary public_id used for deletion
  };
}

export async function deletePhotoFromStorage(publicId: string): Promise<void> {
  const response = await fetch("/api/photos/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  });
  if (!response.ok) throw new Error("Failed to delete photo");
}
