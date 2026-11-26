import { clearSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  await clearSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
