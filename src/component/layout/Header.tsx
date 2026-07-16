"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LuMenu,
  LuShoppingBag,
  LuX,
} from "react-icons/lu";

import Button from "@/component/ui/Button";
import { useCart } from "@/context/CartContext";

const navigationLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Products",
    href: "/products",
  },
  {
    label: "How It Works",
    href: "/#how-it-works",
  },
  {
    label: "Track Order",
    href: "/track-order",
  },
];

const Header = () => {
  const { cartCount } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream">
        <div className="mx-auto flex max-w-site items-center justify-between px-4 py-3 sm:px-5 lg:px-7 lg:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 font-display text-base font-bold tracking-tight text-ink sm:gap-2 sm:text-lg lg:text-xl"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-burgundy sm:h-2.5 sm:w-2.5" />

            <span>PolaroidsBySolly</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-8 font-sans text-sm font-semibold text-ink lg:flex">
            {navigationLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-burgundy"
              >
                {link.label}
              </Link>
            ))}

            <a
              href="https://wa.me/2347088694074"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-burgundy"
            >
              WhatsApp Us
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop only */}
            <div className="hidden lg:block">
              <Button
                variant="ghost"
                size="small"
                href="/products"
              >
                Start Creating
              </Button>
            </div>

            {/* Cart stays visible */}
            <Link
              href="/cart"
              aria-label={`Open cart with ${cartCount} items`}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper sm:h-10 sm:w-10"
            >
              <LuShoppingBag
                aria-hidden="true"
                className="h-4 w-4 sm:h-5 sm:w-5"
              />

              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-cream bg-burgundy px-1 text-[10px] font-bold text-cream">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper lg:hidden"
            >
              <LuMenu
                aria-hidden="true"
                className="h-5 w-5"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        aria-hidden={!menuOpen}
        className={[
          "fixed right-0 top-0 z-[70] flex h-dvh w-[82%] max-w-[340px] flex-col border-l-2 border-ink bg-cream p-5 transition-transform duration-300 ease-out lg:hidden",
          menuOpen
            ? "translate-x-0"
            : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b-2 border-ink/15 pb-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-burgundy" />
            Menu
          </div>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper"
          >
            <LuX
              aria-hidden="true"
              className="h-5 w-5"
            />
          </button>
        </div>

        <nav className="mt-5 flex flex-col">
          {navigationLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeMenu}
              className="border-b border-ink/15 py-4 text-base font-bold transition hover:text-burgundy"
            >
              {link.label}
            </Link>
          ))}

          <a
            href="https://wa.me/2347088694074"
            target="_blank"
            rel="noreferrer"
            onClick={closeMenu}
            className="border-b border-ink/15 py-4 text-base font-bold transition hover:text-burgundy"
          >
            WhatsApp Us
          </a>
        </nav>

        <Button
          href="/products"
          className="mt-auto w-full"
          onClick={closeMenu}
        >
          Start Creating
        </Button>
      </aside>
    </>
  );
};

export default Header;