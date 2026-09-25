"use client"

import { type InputHTMLAttributes, type SelectHTMLAttributes } from "react"

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  errorMessage?: string
}

export function Field({ label, name, errorMessage, className = "", ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-navy">{label}</label>
      <input
        id={name}
        name={name}
        {...props}
        className={`border border-gray-200 rounded-xl px-4 py-3.5 text-ink text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errorMessage ? "border-red-400 focus:ring-red-400" : ""} ${className}`}
      />
      {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
    </div>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  name: string
  errorMessage?: string
}

export function SelectField({ label, name, errorMessage, className = "", children, ...props }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-navy">{label}</label>
      <select
        id={name}
        name={name}
        {...props}
        className={`border border-gray-200 rounded-xl px-4 py-3.5 text-ink text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${className}`}
      >
        {children}
      </select>
      {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
    </div>
  )
}

export default Field
