"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { signIn } from "@/lib/auth";
import { adminLoginSchema, type AdminLoginFormData } from "@/lib/validation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      await signIn(data.email, data.password);
      toast.success("Uspješna prijava!");
      router.push("/admin/dashboard");
    } catch {
      toast.error("Pogrešan email ili lozinka");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#8B5A8E] mb-4">
            <Heart className="w-6 h-6 fill-current" />
            <span className="font-semibold">Digitalne Pozivnice</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Admin prijava</h1>
          <p className="text-gray-500 mt-2">Prijavite se u vaš admin panel</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email adresa</label>
              <input
                {...register("email")}
                type="email"
                className="input-field"
                placeholder="admin@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lozinka</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Prijavljujem..." : "Prijavi se"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Pristupne podatke dobijate uz vašu pozivnicu —{" "}
            <Link href="/#kontakt" className="text-[#8B5A8E] font-semibold hover:underline">
              zatražite pozivnicu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
