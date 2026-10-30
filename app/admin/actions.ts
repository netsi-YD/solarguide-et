"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "solarguide_admin_token";

function computeAdminToken(adminPassword: string): string {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("ADMIN_SESSION_SECRET environment variable is required");
  }
  return crypto
    .createHmac("sha256", sessionSecret)
    .update(adminPassword)
    .digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (
    !adminPassword ||
    adminPassword === "your_admin_password_here" ||
    !sessionSecret ||
    sessionSecret === "your_admin_session_secret_here"
  ) {
    return false;
  }

  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!tokenCookie) {
    return false;
  }

  const expectedToken = computeAdminToken(adminPassword);
  const a = Buffer.from(tokenCookie);
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

export async function loginAdminAction(formData: FormData): Promise<void> {
  const submittedPassword = String(formData.get("password") ?? "");
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (
    !adminPassword ||
    adminPassword === "your_admin_password_here" ||
    !sessionSecret ||
    sessionSecret === "your_admin_session_secret_here"
  ) {
    redirect("/admin?error=unconfigured");
  }

  const submittedHash = computeAdminToken(submittedPassword);
  const expectedHash = computeAdminToken(adminPassword);

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(submittedHash),
    Buffer.from(expectedHash)
  );

  if (!isMatch) {
    redirect("/admin?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, expectedHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  redirect("/admin");
}

export async function logoutAdminAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ADMIN_COOKIE_NAME, path: "/admin" });
  redirect("/admin");
}
