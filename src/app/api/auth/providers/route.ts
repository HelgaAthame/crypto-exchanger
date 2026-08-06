import { NextResponse } from "next/server";
import { configuredProviders } from "@/lib/auth/oauth";

/** Lets the login page show only the buttons that can actually work. */
export async function GET() {
  return NextResponse.json({ providers: configuredProviders() });
}
