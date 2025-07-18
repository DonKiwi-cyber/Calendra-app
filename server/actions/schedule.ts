//Componente/Acción de tipo Servidor
'use server'

import { fromZonedTime } from "date-fns-tz"
import { db } from "@/drizzle/db"
import { SchedulesAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import { scheduleFormSchema } from "@/schema/schedule"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCalendarEventTimes } from "../google/googleCalendar"
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants"
import { addMinutes, areIntervalsOverlapping, isFriday, isMonday, isSaturday, isSunday, isThursday, isTuesday, isWednesday, isWithinInterval, setHours, setMinutes } from "date-fns"

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

/* Filtra una lista de espacios de tiempo y devuelve aquellos que:
  - Coinciden con la agenda de disponibilidad del usuario
  - No se sobrepone con otros eventos del calendario
 */
export async function getValidTimesFromSchedule(
    timesInOrder: Date[], // Todos los espacios de tiempo disponibles para elegir
    event: { clerkUserId: string; durationInMinutes: number } // Información del evento
) : Promise<Date[]> {

  const {clerkUserId: userId, durationInMinutes} = event

  // Define el inicio y fin del rango de tiempo a revisar
  const start = timesInOrder[0]
  const end = timesInOrder.at(-1)

  // Si no hay inicio ni fin, no se revisa nada
  if (!start || !end) return []

  // Obtiene la agenda del usuario junto con las disponibilidades (availabilities)
  const schedule = await getSchedule(userId)

  // Si la agenda no existe, regresa una lista vacía (user has no availabilities)
  if (schedule == null) return []

  // Agrupa las disponibilidades por cada día de la semana (Lunes, Martes,...)
  const groupedAvailabilities = Object.groupBy(
    schedule.availabilities,
    a => a.dayOfWeek
  )

  // Obtiene todos los eventos del calendario de Google que estén dentro del rango de inicio-fin
  const eventTimes = await getCalendarEventTimes(userId, {start,end,})

  // Filtra y regresa espacios de tiempo válidos según las disponibilidades y los conflictos
  return timesInOrder.filter(intervalDate => {
    // Obtiene las disponibilidades para el día específico, ajustado a la zona horaria
    const availabilities = getAvailabilities(
      groupedAvailabilities,
      intervalDate,
      schedule.timezone
    )

    // Define el rango de tiempo para un inicio potencial de un evento en este intervalo
    const eventInterval = {
      start: intervalDate, // Inicio propuesto
      end: addMinutes(intervalDate, durationInMinutes), // Fin propuesto (Inicio + Duración)
    }

    // Guarda los espacios de tiempo que cumplan con las siguientes condiciones:
    return (
      // 1. El espacio no se sobrepone a un evento existente en el calendario
      eventTimes.every(eventTime => {
        return !areIntervalsOverlapping(eventTime, eventInterval)
      }) &&
      // 2. El evento entero se acopla al menos a una ventana de disponibilidad
      availabilities.some(availability => {
        return (
          isWithinInterval(eventInterval.start, availability) && // El inicio entra en la disponibilidad
          isWithinInterval(eventInterval.end, availability) // Así como el fin
        )
      })
    )
  })
}

function getAvailabilities(
  groupedAvailabilities: Partial<
  // Record crea un tipo de dato en el que:
  // - el primer valor es la llave del objeto
  // - el segundo es el valor en sí que el objeto contendrá 
    Record< 
      (typeof DAYS_OF_WEEK_IN_ORDER)[number],
      (typeof SchedulesAvailabilityTable.$inferSelect)[]
    >
  >,
  date: Date,
  timezone: string
): { start: Date; end: Date }[] {
  // Determina el día de la semana basado en la información dada
  const dayOfWeek = (() => {
    if (isMonday(date)) return "monday"
    if (isTuesday(date)) return "tuesday"
    if (isWednesday(date)) return "wednesday"
    if (isThursday(date)) return "thursday"
    if (isFriday(date)) return "friday"
    if (isSaturday(date)) return "saturday"
    if (isSunday(date)) return "sunday"
    return null // Si la fecha no concuerda con un día específico, regresa un valor nulo
  })()

  // Si el día no está especificado, regresa un arreglo vacío
  if (!dayOfWeek) return []

  // GObtiene las disponibilidades por el día específico
  const dayAvailabilities = groupedAvailabilities[dayOfWeek]

  // Si no hay disponibilidades marcadas en ese día, regresa un arreglo vacío
  if (!dayAvailabilities) return []

  // Mapea el rango temporal de la disponibilidad a un objeto { start: Date, end: Date }
  // ajustado a la zona horaria del usuario
  return dayAvailabilities.map(({ startTime, endTime }) => {
    // Parcha la hora de inicio a horas y minutos
    const [startHour, startMinute] = startTime.split(":").map(Number)
    // Parcha la hora de finalización a horas y minutos
    const [endHour, endMinute] = endTime.split(":").map(Number)

    // Crea un objeto Date establecido a la hora y minuto correctos, luego los convierte a la zona horaria
    const start = fromZonedTime(
      setMinutes(setHours(date, startHour), startMinute),
      timezone
    )

    const end = fromZonedTime(
      setMinutes(setHours(date, endHour), endMinute),
      timezone
    )

    // Return the availability interval
    return { start, end }
  })
}