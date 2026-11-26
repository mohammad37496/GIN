import { revokeCurrentSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  try {
    await revokeCurrentSession();
  } catch {
    return NextResponse.json({
      error: "امکان لغو نشست در سرور فراهم نشد. دوباره تلاش کنید.",
      error_en: "The server could not revoke this session. Please try again.",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const destination = new URL(request.url).searchParams.get("locale") === "en" ? "/en" : "/";
  return NextResponse.redirect(new URL(destination, request.url), 303);
}
