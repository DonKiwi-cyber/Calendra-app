'use server'
//Componente de tipo Servidor
/*  Este archivo maneja la integración entre un usuario autenticado y su calendario de Google. 
    Provee dos funciones principales: conseguir todos los eventos del calendario del usuario 
    dentro de un rango específico (`getCalendarEventTimes`), y crear un nuevo evento en el calendario (`createCalendarEvent`). 
    Autentica a los usuarios con OAuth usando Clerk, formatea fechas usando `date-fns`, 
    y se comunica con Google Calendar API usando el paquete `googleapis`. */

import { clerkClient } from "@clerk/nextjs/server"
import { addMinutes, endOfDay, startOfDay } from "date-fns"
import { calendar_v3, google } from "googleapis"

// Obtiene las credenciales de autenticación del usuario para las funciones de Google
async function getOAuthClient(clerkUserId: string) {
    try {
        // Inicia el cliente de Clerk
        const client = await clerkClient()

        // Consigue el token de acceso oAuth del usuario de Clerk
        const { data } = await client.users.getUserOauthAccessToken(clerkUserId, 'google')

        // Si no existe la información o el token está perdido, muestra un error
        if (data.length === 0 || !data[0].token) {
        throw new Error("No hay información de autenticación o token existente para el usuario.")
        }

        
        // Inicia el cliente OAuth2 con las credenciales de Google
        const oAuthClient = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            process.env.GOOGLE_OAUTH_REDIRECT_URL
        )
    
        // Establece las credenciales con el token obtenido
        oAuthClient.setCredentials({ access_token: data[0].token })
    
        return oAuthClient

    } catch(err: any) {
        throw new Error(`Falla al obtener el cliente OAuth: ${err.message }`)
    }
}

// Obtiene y formatea los eventos de un usuario que estén dentro de un rango de tiempo definido
export async function getCalendarEventTimes(
    clerkUserId: string,
    { start, end }: { start: Date; end: Date }
): Promise<{ start: Date; end: Date }[]> {

    try {
        // Obtiene el cliente oAuth para la autenticación del usuario de Google
        const oAuthClient = await getOAuthClient(clerkUserId)

        // Si no se completó la utenticación, muestra un error
        if (!oAuthClient) {
            throw new Error("No se pudo obtener el cliente oAuth.")
        }

        // Consigue los eventos de la API de Google Calendar
        const events = await google.calendar("v3").events.list({
            calendarId: "primary", // Usa el calendario principal del usuario
            eventTypes: ["default"], // Solo consigue los eventos regulares
            singleEvents: true, // Expando los eventos recurrentes en instancias individuales
            timeMin: start.toISOString(), // Inicio del rango
            timeMax: end.toISOString(), // Fin del rango
            maxResults: 2500, // Limita el número de eventos a devolver
            auth: oAuthClient, // Establece el cliente OAuth2 para autenticar el uso de la API
        })

        // Procesa y da formato a los eventos
        return (
            events.data.items
            ?.map(event => {
                // Maneja los eventos que no tienen un horario específico de inicio o fin
                if (event.start?.date && event.end?.date) {
                return {
                    start: startOfDay(new Date(event.start.date)), // Establece el tiempo de inicio en 00:00
                    end: endOfDay(new Date(event.end.date)),       // Establece el tiempo de finalización en 23:59
                }
                }
        
                // Maneja los eventos con horarios de inicio y fin establecidos
                if (event.start?.dateTime && event.end?.dateTime) {
                return {
                    start: new Date(event.start.dateTime), // Convierte el valor en un objeto Date de JavaScript
                    end: new Date(event.end.dateTime),     // Lo mismo con este valor
                }
                }
        
                // Ignora los eventos con datos requeridos no establecidos
                return undefined
            })
            // Filtra los datos indefinidos y refuerza el tipado de datos
            .filter((date): date is { start: Date; end: Date } => date !== undefined) || []
        )  

    } catch (err: any) {
        throw new Error(`Falla al recuperar los eventos del calendario: ${err.message || err}`)
    }
}

export async function createCalendarEvent({
    clerkUserId,
    guestName,
    guestEmail,
    startTime,
    guestNotes,
    durationInMinutes,
    eventName,
}: {
    clerkUserId: string // ID del usuario de Clerk
    guestName: string // Nombre del anfitrión
    guestEmail: string // Correo electrónico del anfitrión
    startTime: Date // Hora de inicio del evento
    guestNotes?: string | null // Notas para el anfitrión (opcional)
    durationInMinutes: number // Duración del evento en minutos
    eventName: string // Nombre o título del evento
    // Especifíca el tipo `Event` como promesa, que representa el evento creado en el calendario.
}): Promise<calendar_v3.Schema$Event> {  
    
    try {
        // Obtiene el cliente OAuth y la información del usuario para su integración en Google Calendar
        const oAuthClient = await getOAuthClient(clerkUserId)
        if (!oAuthClient) {
            // Si el cliente OAuth no es encontrado, muestraq un error
            throw new Error("El cliente OAuth no puede ser obtenido.") 
        }
  
        const client = await clerkClient() // Recupera la instancia del cliente Clerk
        const calendarUser = await client.users.getUser(clerkUserId) // Consigue los detalles del usuario
  
        // Consigue la dirección de email primaria del perfil del usuario utilizando su ID
        const primaryEmail = calendarUser.emailAddresses.find(
            ({ id }) => id === calendarUser.primaryEmailAddressId 
        )
        if (!primaryEmail) {
            throw new Error("El usuario Clerk no tiene una dirección de correo") // Si no hay una dirección de email, muestra un error
        }
  
        // Crea el evento utilizando el cliente de Google API
        const calendarEvent = await google.calendar("v3").events.insert({
            calendarId: "primary", // Usa el calendario principal del usuario
            auth: oAuthClient, // utiliza el cliente OAuth obtenido anteriormente para la autenticación.
            sendUpdates: "all", // Envía notificaciones como correo a los invitados.
            requestBody: {
                attendees: [
                    { email: guestEmail, displayName: guestName }, // Añade al anfitrión como invitado a la lista
                    {
                        email: primaryEmail.emailAddress, // Añade al usuario mismo
                        displayName: `${calendarUser.firstName} ${calendarUser.lastName}`, // Muestra el nombre del usuario.
                        responseStatus: "accepted", // Marca la presencia del cliente como "aceptada"
                    },
                ],
                // Añade una descripción si existen notas del anfitrión
                description: guestNotes ? `Detalles adicionales: ${guestNotes}` : "Sin datos adiocionales.", 
                start: {
                    dateTime: startTime.toISOString(), // Tiempo de inicio del evento
                },
                end: {
                    // Calcula el fin del evento en base a su duración
                    dateTime: addMinutes(startTime, durationInMinutes).toISOString(), 
                },
                // Título del evento, nombre del anfitrión y del usuario
                summary: `${guestName} + ${calendarUser.firstName} ${calendarUser.lastName}: ${eventName}`, 
            },
        })

        return calendarEvent.data  // Regresa la información del evento junto con la del nuevo evento en el calendario

    } catch (error: any) {
        console.error("Error al crear el evento en el calendario:", error.message || error) // Error de consola
        throw new Error(`Falla al crear el evento en el calendario: ${error.message || error}`) // Error con mensaje detallado
    }
}