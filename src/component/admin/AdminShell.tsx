"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  LuLayoutDashboard,
  LuShoppingBag,
  LuUsers,
  LuPackage,
  LuBoxes,
  LuTruck,
  LuTicketPercent,
  LuCreditCard,
  LuWallet,
  LuSettings,
  LuBookOpen,
  LuMenu,
  LuLogOut,
  LuStore,
  LuListChecks,
} from "react-icons/lu";
import {
  adminRequest,
  clearSession,
  restoreSession,
  saveSession,
  setExpiryHandler,
  safeDestination,
} from "@/lib/admin/api";
import { apiPost } from "@/lib/api/client";
import type { Admin, LoginResponse } from "@/lib/admin/types";
import { Button, Feedback } from "./primitives";
const Context = createContext<{
  admin: Admin;
  revision: number;
  refresh: () => void;
} | null>(null);
export function useAdmin() {
  const value = useContext(Context);
  if (!value) throw new Error("Admin session required");
  return value;
}
export const adminNav = [
  {
    group: "WORKSPACE",
    items: [
      ["", "Overview", LuLayoutDashboard],
      ["orders", "Orders", LuShoppingBag],
      ["customers", "Customers", LuUsers],
      ["gallery", "Gallery", LuBookOpen],
      ["reviews", "Reviews", LuUsers],
      ["inventory", "Inventory", LuBoxes],
      ["purchases", "Purchases", LuShoppingBag],
    ],
  },
  {
    group: "SHOP SETUP",
    items: [
      ["products", "Products", LuPackage],
      ["variants", "Product options", LuListChecks],
      ["resource-rules", "Supplies per product", LuBookOpen],
      ["suppliers", "Suppliers", LuStore],
      ["delivery-rates", "Delivery rates", LuTruck],
      ["discounts", "Discounts", LuTicketPercent],
    ],
  },
  {
    group: "MONEY & SETTINGS",
    items: [
      ["payments", "Payments", LuCreditCard],
      ["expenses", "Expenses", LuWallet],
      ["withdrawals", "Owner withdrawals", LuWallet],
      ["settings", "Settings & follow-ups", LuSettings],
    ],
  },
] as const;
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const params = useSearchParams();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [revision, setRevision] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const loginLock = useRef(false);
  useEffect(() => {
    if (!menu) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [menu]);
  const login = pathname === "/admin/login";
  useEffect(() => {
    const c = new AbortController();
    const expire = () => {
      clearSession();
      setAdmin(null);
      setReady(true);
      router.replace(
        `/admin/login?expired=1&next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    };
    setExpiryHandler(expire);
    const session = restoreSession();
    if (!session) {
      queueMicrotask(() => {
        setReady(true);
        if (!login)
          router.replace(
            `/admin/login?next=${encodeURIComponent(pathname + window.location.search)}`,
          );
      });
      return () => {
        c.abort();
        setExpiryHandler();
      };
    }
    adminRequest<Admin>("/auth/admin/me", { signal: c.signal })
      .then((data) => {
        if (c.signal.aborted) return;
        setAdmin(data);
        setReady(true);
        if (login) router.replace(safeDestination(params?.get("next") || null));
      })
      .catch((e) => {
        if (!c.signal.aborted && e.status !== 401) {
          setError(e.message);
          setReady(true);
        }
      });
    const timer = setTimeout(
      expire,
      Math.min(session.expiresAt - Date.now(), 2147483647),
    );
    return () => {
      c.abort();
      clearTimeout(timer);
      setExpiryHandler();
    };
    // Restoration runs on authentication boundary changes; route changes retain the verified session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login, attempt]);
  const logout = () => {
    clearSession();
    setAdmin(null);
    setMenu(false);
    setError("");
    router.replace("/admin/login");
  };
  if (!ready)
    return (
      <div className="admin-root">
        <p className="adm-content" role="status">
          Opening your studio…
        </p>
      </div>
    );
  if (login && !admin)
    return (
      <div className="admin-root adm-login">
        <section className="adm-login-art">
          <Link href="/" className="adm-brand">
            PolaroidsBySolly
          </Link>
          <div>
            <p className="adm-studio-tag">THE STUDIO, BEHIND THE MEMORIES</p>
            <h1>
              A little order.
              <br />A lot of heart.
            </h1>
            <p>
              Your orders, keepsakes and business, all in one thoughtful place.
            </p>
          </div>
          <p className="adm-note">Made for the hands behind every memory.</p>
        </section>
        <main className="adm-login-form">
          <div className="adm-login-card">
            <p className="adm-eyebrow">WELCOME BACK</p>
            <h1>Let’s get to work.</h1>
            <p className="adm-note">Sign in to your studio dashboard.</p>
            <Feedback
              error={error}
              message={
                params?.get("expired")
                  ? "Your session expired. Please sign in again."
                  : undefined
              }
            />
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (loginLock.current) return;
                loginLock.current = true;
                setBusy(true);
                setError("");
                const data = new FormData(e.currentTarget);
                try {
                  const result = await apiPost<LoginResponse>(
                    "/auth/admin/login",
                    {
                      email: String(data.get("email")).trim(),
                      password: String(data.get("password")),
                    },
                  );
                  saveSession({
                    accessToken: result.accessToken,
                    expiresAt: Date.now() + result.expiresIn * 1000,
                    admin: result.admin,
                  });
                  setAdmin(result.admin);
                  router.replace(safeDestination(params?.get("next") || null));
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Sign-in failed. Please retry.",
                  );
                } finally {
                  loginLock.current = false;
                  setBusy(false);
                }
              }}
            >
              <label className="adm-field">
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="adm-field">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
              </label>
              <Button className="primary" disabled={busy}>
                {busy ? "Signing in…" : "Sign in to your studio →"}
              </Button>
            </form>
            <p className="adm-note">
              Owner access only.{" "}
              <Link href="/" className="adm-text-link">
                Back to the shop
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  if (!admin)
    return (
      <div className="admin-root adm-content">
        <Feedback error={error} />
        {error && (
          <>
            <Button
              onClick={() => {
                setError("");
                setAttempt((n) => n + 1);
              }}
            >
              Retry session check
            </Button>
            <Button onClick={logout}>Sign out</Button>
          </>
        )}
      </div>
    );
  return (
    <Context.Provider
      value={{ admin, revision, refresh: () => setRevision((n) => n + 1) }}
    >
      <div className="admin-root">
        <header className="adm-mobile-header">
          <Link href="/admin" className="adm-brand">
            PolaroidsBySolly
          </Link>
          <Button
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            aria-controls="admin-navigation"
            onClick={() => setMenu(!menu)}
          >
            <LuMenu />
          </Button>
        </header>
        {menu && (
          <button
            className="adm-menu-overlay"
            aria-label="Close navigation overlay"
            onClick={() => setMenu(false)}
          />
        )}
        <div className="adm-layout">
          <aside
            className={`adm-sidebar ${menu ? "open" : ""}`}
            id="admin-navigation"
          >
            <Link href="/admin" className="adm-brand">
              PolaroidsBySolly
            </Link>
            <p className="adm-studio-tag">YOUR CREATIVE STUDIO</p>
            <nav aria-label="Studio navigation">
              {adminNav.map((group) => (
                <NavGroup
                  key={group.group}
                  title={group.group}
                  pathname={pathname}
                  paths={group.items.map(([path]) => path)}
                >
                  {group.items.map(([path, title, Icon]) => (
                    <Link
                      key={path}
                      href={`/admin${path ? "/" + path : ""}`}
                      aria-current={
                        pathname === `/admin${path ? "/" + path : ""}` ||
                        (path && pathname.startsWith(`/admin/${path}/`))
                          ? "page"
                          : undefined
                      }
                      onClick={() => setMenu(false)}
                    >
                      <Icon aria-hidden="true" size={16} />
                      {title}
                    </Link>
                  ))}
                </NavGroup>
              ))}
            </nav>
            <div className="adm-sidebar-footer">
              <div className="adm-account">
                <span className="adm-avatar">
                  {admin.name?.slice(0, 1) || "S"}
                </span>
                <div>
                  <strong>{admin.name}</strong>
                  <small>Studio owner</small>
                </div>
              </div>
              <button
                className="mt-4 flex items-center gap-2 text-xs"
                onClick={logout}
              >
                <LuLogOut />
                Sign out
              </button>
            </div>
          </aside>
          <main className="adm-content">{children}</main>
        </div>
      </div>
    </Context.Provider>
  );
}

function NavGroup({
  title,
  pathname,
  paths,
  children,
}: {
  title: string;
  pathname: string;
  paths: readonly string[];
  children: ReactNode;
}) {
  if (title !== "SHOP SETUP")
    return (
      <div>
        <p className="adm-nav-section">{title}</p>
        {children}
      </div>
    );
  const active = paths.some(
    (path) =>
      pathname === `/admin/${path}` || pathname.startsWith(`/admin/${path}/`),
  );
  return (
    <details className="adm-nav-setup" key={pathname} open={active}>
      <summary className="adm-nav-section">Shop setup</summary>
      <p className="adm-note">Products, pricing & supplies</p>
      {children}
    </details>
  );
}
