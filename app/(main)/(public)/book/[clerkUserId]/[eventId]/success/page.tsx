/* El código define un componente de servidor Next.js que muestra un estado de éxito después de que un usuario 
agenda un evento. Toma parámetros del URL (`clerkUserId` y `eventId`) y un parámetro query 
(`startTime`), y le pide a la BD un evento activo que coincida. Si el evento no existe, 
muestra un error 404. Sino, consigue los detalles del usuario desde Clerk, 
da un formato legible al `startTime`, y muestra un mensaje de confirmación que indica el nombre del evento, 
el nombre completo del usuario, y la hora de la agenda. 
También le avisa al usuario que un correo de confirmación será enviado, confirmando que el proceso
fue exitoso. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import { getEvent } from "@/server/actions/events";
import { clerkClient } from "@clerk/nextjs/server";
import { AlertTriangle } from "lucide-react";

 // Función que renderiza una página de éxito
 export default async function SuccessPage({
    params,
    searchParams,
}: {
    // Define la ruta de los parámetros esperados y los busca
    params: Promise<{ clerkUserId: string; eventId: string }>
    searchParams: Promise<{ startTime: string }>
}) {
    const { clerkUserId, eventId } = await params
    const { startTime } = await searchParams
    // Pide a la BD encontrar el evento activo que coincida con el ID del evento y del usuario
    const event = await getEvent(clerkUserId, eventId)
    // Si el evento no existe, muestra un erro 404
    if(!event)  return (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
            <AlertTriangle className="w-5 h-5" />
            <span>Este evento ya no existe.</span>
        </div>
    )

    // Consigue los detalles del usuario basado en el cliente Clerk
    const client = await clerkClient()
    const calendarUser = await client.users.getUser(clerkUserId)
    // Convierte el string de startTime a un objeto JavaScript de tipo Date
    const startTimeDate = new Date(startTime)

    // Renderiza el mensaje de éxito con los detalles del evento y el usuario
    return (
        <Card className="max-w-xl mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
            <CardHeader>
                <CardTitle>
                    ✅Evento {event.name} agendado exitosamente con el usuario {calendarUser.fullName}
                </CardTitle>
                {/* Formatea y muestra la hora y fecha de la reservación */}
                <CardDescription>{formatDateTime(startTimeDate)}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Informa al usuario que resivirá un mensaje de confirmación al correo */}
                Deberías de recibir un correo breve de confirmación. Puedes cerrar esta página.
            </CardContent>
        </Card>
    )
}