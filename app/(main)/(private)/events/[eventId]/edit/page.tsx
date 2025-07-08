import EventForm from "@/components/forms/EventForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvent } from "@/server/actions/events"
import { auth } from "@clerk/nextjs/server"

export default async function EditEventPage({
    params, // Se extrae el Id del evento contenido en los parámetros de la URL
}: {
    params: Promise<{ eventId: string}>
}) {
    // Toma el usuario autenticado actual; redirecciona la página de no existir
    const { userId, redirectToSignIn } = await auth()
    if (!userId) return redirectToSignIn() // Redirección a la página de Inicio de sesión

    const { eventId } = await params
    // Recupera el evento utilizando la ID dada junto con el ID del usuario actual
    const event = await getEvent(userId, eventId)
    if(!event) return <h1 className="text-center text-gray-500 text-xl font-semibold mt-20">
        Evento no encontrado
    </h1>

      // Render the page with a card layout, displaying the "Edit Event" form
    return (
        <Card className="max-w-md mx-auto border-4 border-blue-100 shadow-2xl shadow-accent-foreground">
            <CardHeader>
                <CardTitle>Edit Event</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Render the EventForm with the event details, passing the event data as props */}
                <EventForm
                event={{ ...event, description: event.description || undefined }} // If description is null, pass undefined
                />
            </CardContent>
        </Card>
    )
}