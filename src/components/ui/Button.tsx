"use client"

import { type ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "md" | "sm"
  fullWidth?: boolean
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = true,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "font-semibold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"

  const variants = {
    primary: "bg-[#2EA3F2] text-white active:bg-[#1E8BD9]",
    secondary: "border-2 border-[#2D3940] text-[#2D3940] bg-transparent active:bg-gray-50",
    ghost: "text-[#2EA3F2] bg-transparent active:bg-blue-50",
  }

  const sizes = {
    md: "py-3.5 px-6 text-base",
    sm: "py-2.5 px-4 text-sm",
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
