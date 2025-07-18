import { startOfDay } from "date-fns"
import { z } from "zod"

// Esquema base para crear y procesar la reunión
const meetingSchemaBase = z.object({
  // 'startTime' debe de ser una fecha válida y no estar pasada
  startTime: z.date().min(new Date()),
  // 'guestEmail' es requerido y debe de ser un correo válido
  guestEmail: z.string().email().min(1, "Required"),
  // 'guestName' es un string que no puede estar vacío
  guestName: z.string().min(1, "Required"),
  // 'guestNotes' es opcional
  guestNotes: z.string().optional(),
  // 'timezone' es un string no vacío
  timezone: z.string().min(1, "Required"),
})

// Esquema para validar el input de datos del formulario
export const meetingFormSchema = z
  .object({
    // 'date' debe de ser una fecha válida y debe de ser hoy o después
    date: z.date().min(startOfDay(new Date()), "Must be in the future"),
  })
  // Se combina con los campos básicos del esquema de la reunión
  .merge(meetingSchemaBase)

// Esquema que gestiona las acciones de la reunión, como el guardado en la BD
export const meetingActionSchema = z
  .object({
    // 'eventId' es un string requerido
    eventId: z.string().min(1, "Required"),

    // 'clerkUserId' es un string requerido
    clerkUserId: z.string().min(1, "Required"),
  })
  // Se combina con el esquema base para incluir el tiempo, la información del anfitrión y la zona horaria
  .merge(meetingSchemaBase)
