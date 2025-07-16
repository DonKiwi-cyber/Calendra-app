import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convierte un valor de tiempo string a uno decimal
// Está hecho para fines visuales
export function timeToFloat(time: string): number {
  // Divide el valor por el caracter ":" y los convierte en números, guardándolos en [hours, minutes]
  const [hours, minutes] = time.split(":").map(Number)
  // Nota: .map(Number) es una manera corta de convertir un string a un number

  // Convierte los minutos en una fracción de hora y luego las agrega a las horas
  return hours + minutes / 60
}