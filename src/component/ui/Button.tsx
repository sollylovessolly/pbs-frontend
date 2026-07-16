"use client";
import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "small" | "medium";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-burgundy text-cream",
  ghost: "bg-paper text-ink",
};

const sizeStyles: Record<ButtonSize, string> = {
  small: "px-[18px] py-[9px] text-[13px]",
  medium: "px-7 py-3.5 text-[15px]",
};

export default function Button({
  children,
  href,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  className = "",
  type = "button",
  disabled = false,
  onClick,
}: ButtonProps) {
  const styles = [
    "inline-flex items-center justify-center gap-2",
    "rounded-full border-2 border-ink",
    "font-sans font-bold",
    "shadow-button",
    "transition-[transform,box-shadow] duration-150",
    "hover:-translate-x-0.5 hover:-translate-y-0.5",
    "hover:shadow-button-hover",
    "active:translate-x-0 active:translate-y-0",
    "active:shadow-button",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-burgundy",
    "focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link
        href={href}
        className={styles}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          onClick?.();
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={styles}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}