import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { publicId } = await request.json();

  // Dozvoli brisanje samo unutar app foldera — spriječava brisanje
  // drugih fajlova na istom Cloudinary računu
  if (typeof publicId !== "string" || !publicId.startsWith("pozivnica/")) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.round(Date.now() / 1000);

  // Generate SHA-1 signature
  const str = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: formData }
  );

  const result = await response.json();

  if (result.result !== "ok") {
    return NextResponse.json({ error: "Delete failed", result }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
