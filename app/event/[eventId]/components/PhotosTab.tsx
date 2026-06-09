"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Camera, Trash2, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { getPhotos, addPhoto, deletePhoto, getGuest } from "@/lib/db";
import { uploadPhoto, deletePhotoFromStorage, validateFile } from "@/lib/storage";
import type { Photo, Guest } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface Props {
  eventId: string;
  guestId: string | null;
}

interface UploadingFile {
  name: string;
  progress: number;
}

export default function PhotosTab({ eventId, guestId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (guestId) {
        const [p, g] = await Promise.all([
          getPhotos(eventId, guestId),
          getGuest(eventId, guestId),
        ]);
        setPhotos(p);
        setGuest(g);
      }
      setLoading(false);
    };
    load();
  }, [eventId, guestId]);

  const handleFiles = async (files: FileList | File[]) => {
    if (!guestId || !guest) {
      toast.error("Morate popuniti RSVP da biste uploadali slike");
      return;
    }
    if (photos.length + files.length > 50) {
      toast.error("Maksimalno 50 fotografija po gostu");
      return;
    }

    const validFiles = Array.from(files).filter((f) => {
      const err = validateFile(f);
      if (err) { toast.error(`${f.name}: ${err}`); return false; }
      return true;
    });

    for (const file of validFiles) {
      setUploading((prev) => [...prev, { name: file.name, progress: 0 }]);
      try {
        const { url, storagePath } = await uploadPhoto(eventId, guestId, file, (progress) => {
          setUploading((prev) => prev.map((u) => u.name === file.name ? { ...u, progress } : u));
        });
        const photoId = await addPhoto(eventId, {
          eventId,
          guestId,
          url,
          storagePath,
          fileName: file.name,
          guestLastName: guest.lastName,
          guestFirstName: guest.firstName,
          fileSize: file.size,
        });
        setPhotos((prev) => [{
          id: photoId,
          eventId,
          guestId,
          url,
          storagePath,
          uploadedAt: new Date(),
          fileName: file.name,
          guestLastName: guest.lastName,
          guestFirstName: guest.firstName,
          fileSize: file.size,
        }, ...prev]);
        toast.success(`${file.name} uploadana`);
      } catch {
        toast.error(`Greška pri uploadu: ${file.name}`);
      } finally {
        setUploading((prev) => prev.filter((u) => u.name !== file.name));
      }
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Obrisati ovu fotografiju?")) return;
    try {
      await deletePhotoFromStorage(photo.storagePath);
      await deletePhoto(eventId, photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (previewIndex !== null && photos[previewIndex]?.id === photo.id) setPreviewIndex(null);
      toast.success("Fotografija obrisana");
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  if (!guestId) {
    return (
      <div className="card text-center py-12 animate-fadeIn">
        <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Popunite RSVP prvo</h3>
        <p className="text-gray-400 text-sm">Da biste uploadali fotografije, najprije popunite RSVP formu na prethodnoj tabi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragging ? "border-[#8B5A8E] bg-[#8B5A8E]/5" : "border-gray-200 hover:border-[#8B5A8E]/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-1">Prevucite fotografije ovdje</p>
        <p className="text-xs text-gray-400 mb-4">JPG, PNG, WebP · Max 10MB · Max 50 fotografija</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => inputRef.current?.click()} className="btn-primary text-sm py-2.5 px-5">
            Odaberi fajlove
          </button>
          <label className="btn-secondary text-sm py-2.5 px-5 cursor-pointer">
            <Camera className="w-4 h-4 inline mr-1.5" />
            Kamera
            <input type="file" accept="image/*" capture="environment" className="sr-only"
              onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </label>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only"
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u) => (
            <div key={u.name} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm text-gray-700 truncate">{u.name}</p>
                <span className="text-xs text-[#8B5A8E] font-medium">{u.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8B5A8E] rounded-full transition-all"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {photos.length > 0 && (
        <p className="text-sm text-gray-500 text-center">{photos.length}/50 fotografija uploadano</p>
      )}

      {/* Photos grid */}
      {photos.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Niste još uploadali ni jednu fotografiju</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={photo.url}
                alt={photo.fileName}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 33vw, 200px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => setPreviewIndex(idx)} className="p-2 bg-white rounded-full">
                  <Eye className="w-4 h-4 text-gray-800" />
                </button>
                <button onClick={() => handleDelete(photo)} className="p-2 bg-white rounded-full">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {previewIndex !== null && photos[previewIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button onClick={() => setPreviewIndex(null)} className="absolute top-4 right-4 p-2 text-white">
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => setPreviewIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
            className="absolute left-3 p-2 text-white disabled:opacity-30"
            disabled={previewIndex === 0}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="relative max-w-lg w-full">
            <Image
              src={photos[previewIndex].url}
              alt={photos[previewIndex].fileName}
              width={800}
              height={800}
              className="object-contain max-h-[75vh] rounded-xl mx-auto"
            />
            <p className="text-center text-gray-400 text-xs mt-3">
              {formatDateTime(photos[previewIndex].uploadedAt)} · {previewIndex + 1}/{photos.length}
            </p>
          </div>
          <button
            onClick={() => setPreviewIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i))}
            className="absolute right-3 p-2 text-white disabled:opacity-30"
            disabled={previewIndex === photos.length - 1}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
