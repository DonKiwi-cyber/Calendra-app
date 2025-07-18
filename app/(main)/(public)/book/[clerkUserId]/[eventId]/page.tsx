import { getEvent } from "@/server/actions/events";
import { clerkClient } from "@clerk/nextjs/server";
import { AlertTriangle } from "lucide-react";
import {
  addYears,
  eachMinuteOfInterval,
  endOfDay,
  roundToNearestMinutes,
} from "date-fns"
import { getValidTimesFromSchedule } from "@/server/actions/schedule";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NoTimeSlots from "@/components/NoTimeSlits";
import MeetingForm from "@/components/forms/MeetingForm";

export default async function BookingPage({
    params
}: {
    params: Promise<{ clerkUserId: string; eventId: string }>
}) {

    const { clerkUserId, eventId } = await params

    // Consigue la información del evento desde la BD con el id del usuario y el id del evento
    const event = await getEvent(clerkUserId, eventId)
    // Si el evento no existe, muestra un error 404
    if(!event)  return (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
            <AlertTriangle className="w-5 h-5" />
            <span>Este evento no existe</span>
        </div>
    )

      // Obtiene el objeto de Usuario de Clerk
      const client = await clerkClient()
      const calendarUser = await client.users.getUser(clerkUserId)

     // Define un rango de fecha desde ahora (redondeado a los próximos 15 minutos) hasta 1 año después
    const startDate = roundToNearestMinutes(new Date(), {
      nearestTo: 15,
      roundingMethod: "ceil",
    })
    
    const endDate = endOfDay(addYears(startDate, 1)) // Establece el rango a un año 

    // Genera espacios de tiempo disponibles para el evento siguiendo la lógica de la agenda personalizada
    const validTimes = await getValidTimesFromSchedule(
        eachMinuteOfInterval({ start: startDate, end: endDate }, { step: 15 }),
        event
    )

    // Si no hay espacios de tiempo libres, muestra un mensaje y una opción para elegir otro evento
    if (validTimes.length === 0) {
        return <NoTimeSlots event={event} calendarUser={calendarUser} />
    }


  // Muestra el formulario de reservación con la lista de tiempos disponibles
  return (
    <Card className="max-w-4xl mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>
          Book {event.name} with {calendarUser.fullName}
        </CardTitle>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <MeetingForm
          validTimes={validTimes}
          eventId={event.id}
          clerkUserId={clerkUserId}
        />
      </CardContent>
    </Card>
  )   

  }