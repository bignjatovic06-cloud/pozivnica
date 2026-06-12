"use client";

import { useState, useEffect } from "react";
import { Camera, Download, Trash2, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { getPhotos, deletePhoto, getGuests } from "@/lib/db";
import { deletePhotoFromStorage } from "@/lib/storage";
import type { Photo, Guest } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface Props {
  eventId: string;
}

type SortBy = "newest" | "lastName";

export default function PhotoManagement({ eventId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterGuest, setFilterGuest] = useState<string>("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const [p, g] = await Promise.all([getPhotos(eventId), getGuests(eventId)]);
      setPhotos(p);
      setGuests(g);
      setLoading(false);
    };
    load();
  }, [eventId]);

  const filtered = photos.filter((p) => !filterGuest || p.guestId === filterGuest);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    if (sortBy === "lastName") return a.guestLastName.localeCompare(b.guestLastName);
    return 0;
  });

  const guestsWithPhotos = guests.filter((g) => photos.some((p) => p.guestId === g.id));

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Obrisati ovu fotografiju?")) return;
    try {
      await deletePhotoFromStorage(photo.storagePath);
      await deletePhoto(eventId, photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (previewIndex !== null && sorted[previewIndex]?.id === photo.id) setPreviewIndex(null);
      toast.success("Fotografija obrisana");
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  const downloadPhoto = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.click();
  };

  const totalSize = photos.reduce((sum, p) => sum + (p.fileSize || 0), 0);
  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-[#8B5A8E]">{photos.length}</p>
          <p className="text-sm text-gray-500 mt-1">Ukupno fotografija</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-[#8B5A8E]">{guestsWithPhotos.length}</p>
          <p className="text-sm text-gray-500 mt-1">Gostiju koji su uploadali</p>
        </div>
        <div className="card text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-[#8B5A8E]">{formatSize(totalSize)}</p>
          <p className="text-sm text-gray-500 mt-1">Ukupno prostora</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterGuest}
          onChange={(e) => setFilterGuest(e.target.value)}
          className="input-field py-2 text-sm"
        >
          <option value="">Svi gosti</option>
          {guestsWithPhotos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.lastName} {g.firstName} ({photos.filter((p) => p.guestId === g.id).length} sl.)
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {(["newest", "lastName"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                sortBy === s ? "bg-[#8B5A8E] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "newest" ? "Najnovije" : "Po prezimenu"}
            </button>
          ))}
        </div>
      </div>

      {/* Guest summary table */}
      {guestsWithPhotos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Fotografije po gostima</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Gost</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Fotografija</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {guestsWithPhotos
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((guest) => {
                  const count = photos.filter((p) => p.guestId === guest.id).length;
                  return (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{guest.lastName} {guest.firstName}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{count} fotografija</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setFilterGuest(filterGuest === guest.id ? "" : guest.id)}
                          className="text-xs text-[#8B5A8E] hover:underline"
                        >
                          {filterGuest === guest.id ? "Pokaži sve" : "Prikaži"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Photo grid */}
      {sorted.length === 0 ? (
        <div className="card text-center py-16">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nema uploadanih fotografija</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sorted.map((photo, idx) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={photo.url}
                alt={photo.fileName}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setPreviewIndex(idx)}
                  className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadPhoto(photo.url, photo.fileName)}
                  className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(photo)}
                  className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-white text-xs font-medium truncate">{photo.guestLastName} {photo.guestFirstName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {previewIndex !== null && sorted[previewIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setPreviewIndex(null)} className="absolute top-4 right-4 p-2 text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => setPreviewIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
            className="absolute left-4 p-2 text-white hover:text-gray-300 disabled:opacity-30"
            disabled={previewIndex === 0}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="max-w-4xl w-full">
            <div className="relative aspect-auto max-h-[75vh] flex items-center justify-center">
              <Image
                src={sorted[previewIndex].url}
                alt={sorted[previewIndex].fileName}
                width={1200}
                height={800}
                className="object-contain max-h-[70vh] rounded-xl"
              />
            </div>
            <div className="text-center mt-4 text-white">
              <p className="font-medium">{sorted[previewIndex].guestLastName} {sorted[previewIndex].guestFirstName}</p>
              <p className="text-sm text-gray-400">{formatDateTime(sorted[previewIndex].uploadedAt)}</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={() => downloadPhoto(sorted[previewIndex].url, sorted[previewIndex].fileName)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={() => handleDelete(sorted[previewIndex])}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-sm text-red-300"
                >
                  <Trash2 className="w-4 h-4" /> Obriši
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{previewIndex + 1} / {sorted.length}</p>
            </div>
          </div>

          <button
            onClick={() => setPreviewIndex((i) => (i !== null && i < sorted.length - 1 ? i + 1 : i))}
            className="absolute right-4 p-2 text-white hover:text-gray-300 disabled:opacity-30"
            disabled={previewIndex === sorted.length - 1}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
