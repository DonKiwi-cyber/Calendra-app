'use server'

import { db } from "@/drizzle/db";
import { meetingActionSchema } from "@/schema/meetings";
import { fromZonedTime } from "date-fns-tz";
import { getValidTimesFromSchedule } from "./schedule";
import { createCalendarEvent } from "../google/googleCalendar";
import { z } from "zod";

// Acción en el servidor para crear una reunión
export async function createMeeting(
  unsafeData: z.infer<typeof meetingActionSchema> // Datos entrantes e inferidos desde el meetingActionSchema
) {
  try {
    // Valida la información en base al esquema
    const { success, data } = meetingActionSchema.safeParse(unsafeData);
    // Si la validación falla, muestra un error
    if (!success) {
      throw new Error("Información inválida.");
    }

    // Busca el evento en la BD que coincida con el ID proporcionado y que esté activo
    const event = await db.query.EventTable.findFirst({
      where: ({ clerkUserId, isActive, id }, { eq, and }) =>
        and(
          eq(isActive, true), // El evento debe de estar activo
          eq(clerkUserId, data.clerkUserId), // Debe pertenecer al usuario 
          eq(id, data.eventId) // Coincidir con el ID proporcionado
        ),
    });
    // Si la búsqueda falla, muestra un error
    if (!event) {
      throw new Error("El evento no fue encontrado.");
    }

    // Interpreta la hora de inicio de la zona horaria del usuario y la convierte en una fecha UTC
    
    const startInTimezone = fromZonedTime(data.startTime, data.timezone);
    // Revisa si la hora seleccionada es válida dentro de la disponibilidad del evento
    const validTimes = await getValidTimesFromSchedule([startInTimezone], event);
    // Si no es válida, muestra un error
    if (validTimes.length === 0) {
      throw new Error("La hora seleccionada no es válida.");
    }

    // Crea el evento en el calendario de Google con todos los detalles necesarios
    await createCalendarEvent({
      ...data, 
      startTime: startInTimezone, // Hora de inicio ajustada a la zona horaria correcta
      durationInMinutes: event.durationInMinutes, // Duración del evento
      eventName: event.name, // Nombre/título del evento
    });
    return {clerkUserId: data.clerkUserId, eventId : data.eventId, startTime: data.startTime}

  } catch (error: any) {
    console.error(`Error al crear la reunción: ${error.message || error}`);
    throw new Error(`Fallo al crear la reunión: ${error.message || error}`);
  }
}