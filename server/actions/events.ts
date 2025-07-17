//Componente/Acción de tipo Servidor
'use server'

import { db } from "@/drizzle/db";
import { EventTable } from "@/drizzle/schema";
import { eventFormSchema } from "@/schema/events";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

//La función crea un evento en la BD después de validarlo
export async function createEvent(
    unsafeData: z.infer<typeof eventFormSchema> //Datos validados por el esquema zod
    ): Promise<void> {
    try {

        //Autentica al usuario utilizando Clerk
        const { userId } = await auth()

        //Valida los datos entrantes a través del esquema del formulario
        const { success, data } = eventFormSchema.safeParse(unsafeData)

        //Si la validación tanto del usuario como de la informacipon falla, muestra un error
        if (!success || !userId) {
            throw new Error("Invalid event data or user not authenticated.")
        }
  
        //Inserta la información validada, ligándola al usuario actual
        await db.insert(EventTable).values({ ...data, clerkUserId: userId })
      
    } catch (error: any) {
            
        //En caso de error, muestra un mensaje
        throw new Error(`Error al crear el evento:  ${error.message || error}`)
        
    } finally {
      
        /*Revalida el 'path' para asegurar que la página salve información fresca 
        después de la operación*/
        revalidatePath('/events')
    }
}
    
/*La función actualiza un evento existente en la BD después de validar los datos y
revisar que el propietario coincida*/
export async function updateEvent(
    id:string, //ID del evento a actualizar
    unsafeData: z.infer<typeof eventFormSchema>
    ): Promise<void> {
        try {

        //Autentica al usuario
        const { userId } = await auth()
  
        // Validate the incoming data against the event form schema
        const { success, data } = eventFormSchema.safeParse(unsafeData)
  
        //Si la validación falla o el usuario no está autenticado, muestra un error
        if (!success || !userId) {
            throw new Error("Información inválida o usuario no autenticado.")
        }
  
        //Actualiza el evento
        const { rowCount } = await db
            .update(EventTable)
            .set({ ...data }) //Utiliza la información validad
            .where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)))
            //Asegura que el usuario sea dueño del evento
  
        /*Si el evento no fue actualizado (ya sea por no existir o no pertenecer al usuario)
        mostrará un error*/
        if (rowCount === 0) {
        throw new Error("El evento no fue encontrado o el usuario no tiene permisos para actualizarlo")
      }
  
    } catch (error: any) {

        //En caso de error, muestra un mensaje
        throw new Error(`Error al actualizar el evento:  ${error.message || error}`)

    } finally {
        /*Revalida el 'path' para asegurar que la página salve información fresca 
        después de la operación*/
        revalidatePath('/events')
    }
}

//Esta función elimina un evento de la BD después de validar al usuario
    export async function deleteEvent(
      id: string // ID del evento
    ): Promise<void> {
    try {

        //Autentica al usuario
        const { userId } = await auth()
    
        //Muestra un error si el usuario no fue autenticado
        if (!userId) {
            throw new Error("User not authenticated.")
        }
    
        //Elimina el evento sólo si pertenece a un usuario autenticado
        const { rowCount } = await db
            .delete(EventTable)
            .where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)))
    
        /*Si el evento no fue eliminado (ya sea porque no fue encontrado o no le pertenece al usuario)
        se mostrará un error*/
        if (rowCount === 0) {
            throw new Error("El evento no fue encontrado o el usuario no tiene permiso para eliminarlo.")
        }
    
    } catch (error: any) {

        //En caso de error, muestra un mensaje
        throw new Error(`Error al eliminar el evento:  ${error.message || error}`)

    } finally {
        /*Revalida el 'path' para asegurar que la página salve información fresca 
        después de la operación*/
        revalidatePath('/events')
    }
}

//Infiere el tipo de una fila del esquema EventTable
type EventRow = typeof EventTable.$inferSelect

//Función para obtener todos los eventos (activos e inactivos) de un usuario
export async function getEvents(clerkUserId: string): Promise<EventRow[]> {
    //Obtiene los eventos de la BD donde el ID del usuario coincida con el ID dado
    const events = await db.query.EventTable.findMany({
    
    //where: Define un filtro para la petición query
    //({ clerkUserId: userIdCol }, { eq }) => ... — Es una función destructurada:
    // clerkUserId es la variable que contiene el ID del usuario
    /*userIdCol es una referencia a una columna en la BD, renombrando la variable clerkUserId 
    a userIdCol para más claridad*/
    where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, clerkUserId),

    //Los eventos son ordenados alfabéticamente por el nombre
    orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
    })

    return events
}

// Recupera un evento específico
export async function getEvent(userId: string, eventId: string): Promise<EventRow | undefined> {
    // Recupera el primer evento encontrado con las características ingresadas (ID del vento y del usuario)
    const event = await db.query.EventTable.findFirst({ 
        where: ({ id, clerkUserId }, { and, eq }) =>
        and(eq(clerkUserId, userId), eq(id, eventId)), // Se asegura que el evento pertenezca al usuario actual
    })

    return event ?? undefined // Regresa un valor 'undefined' si no se encontró el evento
}

// Async function to fetch all active (public) events for a specific user
export async function getPublicEvents(clerkUserId: string): Promise<PublicEvent[]> {
  // Query the database for events where:
  // - the clerkUserId matches
  // - the event is marked as active
  // Events are ordered alphabetically (case-insensitive) by name
  const events = await db.query.EventTable.findMany({
    where: ({ clerkUserId: userIdCol, isActive }, { eq, and }) =>
      and(eq(userIdCol, clerkUserId), eq(isActive, true)),
    orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
  })

  // Cast the result to the PublicEvent[] type to indicate all are active
  return events as PublicEvent[]
}
