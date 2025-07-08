//Componente/Acción de tipo Servidor
'use server'

import { db } from "@/drizzle/db"
import { SchedulesAvailabilityTable, ScheduleTable } from "@/drizzle/schema"

type ScheduleRow = typeof ScheduleTable.$inferSelect
type AvailabilityRow = typeof SchedulesAvailabilityTable.$inferSelect

// Combina la agenda completa conlos días disponibles
export type FullSchedule = ScheduleRow & {
  availabilities: AvailabilityRow[]
}

// Esta función obtiene la agenda junto con los días disponibles del usuario
export async function getSchedule(userId: string): Promise<FullSchedule | null> {
  // Busca el primer ScheduleTable que coincida con el ID del usuario
  // También lee la información de los días libres de la tabla
  const schedule = await db.query.ScheduleTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId), // Encuentra la agenda que pertenezca al usuario actual
    with: {
      availabilities: true, // Incluye todos los datos relacionados con los díaslibres
    },
  })

  // Return the schedule if found, or null if it doesn't exist
  return schedule as FullSchedule | null
}