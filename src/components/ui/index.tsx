"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

// ── Button ────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-brand-yellow text-brand-black hover:bg-yellow-400 shadow-sm":
            variant === "primary",
          "bg-brand-black text-white hover:bg-brand-gray-600":
            variant === "secondary",
          "bg-transparent text-brand-black hover:bg-brand-gray-100 border border-brand-gray-200":
            variant === "ghost",
          "bg-red-500 text-white hover:bg-red-600": variant === "danger",
          "h-8 px-3 text-xs rounded-xl": size === "sm",
          "h-11 px-5 text-sm rounded-2xl": size === "md",
          "h-14 px-7 text-base rounded-2xl": size === "lg",
          "h-10 w-10 rounded-2xl p-0": size === "icon",
        },
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "yellow" | "green" | "red" | "blue";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-brand-gray-100 text-brand-gray-500": variant === "default",
          "bg-brand-yellow text-brand-black": variant === "yellow",
          "bg-green-100 text-green-700": variant === "green",
          "bg-red-100 text-red-700": variant === "red",
          "bg-blue-100 text-blue-700": variant === "blue",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("animate-spin text-brand-yellow", className)} />
  );
}

// ── Avatar ────────────────────────────────────────────────

import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-brand-black text-brand-yellow font-bold flex items-center justify-center flex-shrink-0",
        {
          "w-6 h-6 text-[10px]": size === "sm",
          "w-8 h-8 text-xs": size === "md",
          "w-12 h-12 text-base": size === "lg",
        },
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-brand-gray-600 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-12 px-4 rounded-2xl border bg-white text-brand-black placeholder:text-brand-gray-300 outline-none transition-all",
            "border-brand-gray-200 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20",
            error && "border-red-400 focus:border-red-400 focus:ring-red-100",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── Select ────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-brand-gray-600 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full h-12 px-4 rounded-2xl border bg-white text-brand-black outline-none transition-all appearance-none",
            "border-brand-gray-200 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

// ── Modal ─────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-brand-gray-100">
            <h2 className="text-lg font-bold text-brand-black">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-gray-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────

export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}
