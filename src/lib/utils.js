import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Standardized placeholder for absent values. Use this instead of a raw "—"
// literal so the character/style can be changed in one place.
// Separators inside a line of text should use " • " instead — "—" is reserved
// exclusively for "missing value".
export const EMPTY_VALUE = "—";