//Componente/Acción de tipo Servidor
'use server'

import { db } from "@/drizzle/db"
import { SchedulesAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import { scheduleFormSchema } from "@/schema/schedule"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import { z } from "zod"

type ScheduleRow = typeof ScheduleTable.$inferSelect
type AvailabilityRow = typeof SchedulesAvailabilityTable.$inferSelect

// Combina la agenda completa conlos días disponibles
export type FullSchedule = ScheduleRow & {
  availabilities: AvailabilityRow[]
}

// Esta función obtiene la agenda junto con los días disponibles del usuario
export async function getSchedule(userId: string): Promise<FullSchedule> {
  // Busca el primer ScheduleTable que coincida con el ID del usuario
  // También lee la información de los días libres de la tabla
  const schedule = await db.query.ScheduleTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId), // Encuentra la agenda que pertenezca al usuario actual
    with: {
      availabilities: true, // Incluye todos los datos relacionados con los díaslibres
    },
  })

  // Return the schedule if found, or null if it doesn't exist
  return schedule as FullSchedule
}

// This server action saves the user's schedule and availabilities
export async function saveSchedule(
  unsafeData: z.infer<typeof scheduleFormSchema> // Accepts unvalidated form data
) {
  try {
    const { userId } = await auth() // Get currently authenticated user's ID

    // Validate the incoming data against the schedule schema
    const { success, data } = scheduleFormSchema.safeParse(unsafeData)

    // If validation fails or no user is authenticated, throw an error
    if (!success || !userId) {
      throw new Error("Invalid schedule data or user not authenticated.")
    }

    // Destructure availabilities and the rest of the schedule data
    const { availabilities, ...scheduleData } = data

    // Insert or update the user's schedule and return the schedule ID
    const [{ id: scheduleId }] = await db
      .insert(ScheduleTable)
      .values({ ...scheduleData, clerkUserId: userId }) // Associate schedule with the current user
      .onConflictDoUpdate({
        target: ScheduleTable.clerkUserId, // Update if a schedule for this user already exists
        set: scheduleData,
      })
      .returning({ id: ScheduleTable.id }) // Return the schedule ID for use in the next step

    // Initialize SQL statements for batch execution
    const statements: [BatchItem<"pg">] = [
      // First, delete any existing availabilities for this schedule
      db
        .delete(SchedulesAvailabilityTable)
        .where(eq(SchedulesAvailabilityTable.scheduleId, scheduleId)),
    ]

    // If there are availabilities, prepare an insert operation for them
    if (availabilities.length > 0) {
      statements.push(
        db.insert(SchedulesAvailabilityTable).values(
          availabilities.map(availability => ({
            ...availability,
            scheduleId, // Link availability to the saved schedule
          }))
        )
      )
    }

    // Run all statements in a single transaction
    await db.batch(statements)

  } catch (error: any) {
    // Catch and throw an error with a readable message
    throw new Error(`Failed to save schedule: ${error.message || error}`)
  } finally {
    // Revalidate the /schedule path to update the cache and reflect the new data
    revalidatePath('/schedule')
  }
}