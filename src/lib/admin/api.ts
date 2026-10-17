import { apiRequest, ApiError, queryString } from "../api/client";
import {
  normalizeCatalogue,
  normalizeCatalogueProduct,
  type PublicCatalogueProduct,
} from "../api/catalogue";
import type { Admin } from "./types";
export const ADMIN_SESSION_KEY = "pbs-admin-session-v1";
type Session = { accessToken: string; expiresAt: number; admin: Admin };
let session: Session | null = null;
let expired: (() => void) | undefined;
export function setExpiryHandler(handler?: () => void) {
  expired = handler;
}
export function getSession() {
  return session;
}
export function saveSession(value: Session) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(value));
  session = value;
}
export function restoreSession() {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(ADMIN_SESSION_KEY) || "null",
    );
    if (
      value &&
      typeof value.accessToken === "string" &&
      Number(value.expiresAt) > Date.now()
    ) {
      session = value;
      return session;
    }
  } catch {}
  clearSession();
  return null;
}
export function clearSession() {
  session = null;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
}
export async function adminRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  if (!session || session.expiresAt <= Date.now()) {
    clearSession();
    expired?.();
    throw new ApiError("Your session expired. Please sign in again.", 401);
  }
  const token = session.accessToken;
  try {
    const result = await apiRequest<T>(
      path + queryString(options.query || {}),
      {
        method: options.method || "GET",
        signal: options.signal,
        headers: { Authorization: `Bearer ${token}` },
        ...(options.body !== undefined
          ? {
              body:
                options.body instanceof FormData
                  ? options.body
                  : JSON.stringify(options.body),
            }
          : {}),
      },
    );
    if (session?.accessToken !== token)
      throw new DOMException("Session ended", "AbortError");
    if (!options.method || options.method === "GET") {
      const endpoint = path.split("?")[0];
      if (endpoint === "/products")
        return normalizeCatalogue(result as PublicCatalogueProduct[]) as T;
      if (/^\/products\/[^/]+$/.test(endpoint))
        return normalizeCatalogueProduct(result as PublicCatalogueProduct) as T;
    }
    return result;
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      session?.accessToken === token
    ) {
      clearSession();
      expired?.();
    }
    throw error;
  }
}
export const safeDestination = (value: string | null) =>
  value &&
  (value === "/admin" ||
    value.startsWith("/admin/") ||
    value.startsWith("/admin?")) &&
  !value.startsWith("/admin/login") &&
  !value.includes("\\") &&
  !value.startsWith("//")
    ? value
    : "/admin";
