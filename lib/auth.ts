import { compareSync } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload, Username } from "./types";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error("AUTH_SECRET is required");
}
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(currentUser: Username) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ authenticated: true, currentUser, exp: Math.floor(expiresAt.getTime() / 1000) });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined): Promise<SessionPayload | null> {
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  return decrypt(session);
}

export async function getCurrentUser(): Promise<Username | null> {
  const session = await getSession();
  return session?.currentUser ?? null;
}

export function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  // Support bcrypt hashes in production while keeping legacy plaintext compatibility.
  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
    return compareSync(inputPassword, storedPassword);
  }
  return inputPassword === storedPassword;
}
