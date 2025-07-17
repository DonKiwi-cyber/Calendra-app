'use client'

import { getPublicEvents, PublicEvent } from "@/server/actions/events"
import { useEffect, useState } from "react"
import Loading from "./Loading"
import { useUser } from "@clerk/nextjs"
import { Copy, Eye } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"
import PublicEventCard from "./PublicEventCard"

// Define el tipo de propiedades que el componente recibirá
type PublicProfileProps = {
    userId: string // El id del usuario para el profile
    fullName: string | null // Nombre completo del usuario
}

export default function PublicProfile ({ userId, fullName }: 
    PublicProfileProps    
) {

    // Estado de los eventos guardados o el estado de carga
    const [events, setEvents] = useState<PublicEvent[] | null>(null)
    const {user} = useUser()

    const copyProfileUrl = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/book/${userId}`)
            toast("URL del perfil copiado al portapapeles")
        } catch (error) {
            console.error("Falla al copiar el URL:", error)
        }
    }

    // Obtiene los eventos cuando el componente se monta
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await getPublicEvents(userId) // Llama a la acción para obtener los eventos públicos
                setEvents(fetchedEvents) // Establece el estado de los eventos
            } catch (error) {
                console.error("Error fetching events:", error)
                setEvents([]) // Establece un arreglo vacío en caso de que ocurra un error
            }
        }

        fetchEvents()
    }, [userId]) // Vuelve a obtener los eventos cuando el id del usuario cambia

    // Render loading component if events are not yet fetched
    if (events === null) {
        return (
            <div className="max-w-5xl mx-auto text-center">
                <Loading />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto p-5">

                {user?.id === userId && (
                // Mensaje con ícono de Ojo (solo para el propietario del evento)
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-bold">
                    <Eye className="w-4 h-4" />
                    <p>Así es como la gente verá tu perfil público</p>
                </div>
                )}

            {/* Muestra el nombre del usuario */}
            <div className="text-4xl md:text-5xl font-black mb-4 text-center">
                {fullName}
            </div>

            {/* Botón para copiar la URL del perfil público */}
            {user?.id === userId && (
                <div className="flex justify-center mb-6">
                    <Button
                    className="cursor-pointer"
                    variant={"outline"}
                    onClick={copyProfileUrl}
                    >
                        <Copy className="size-4" />
                        Copiar URL del perfil
                    </Button>
                </div>
            )}

            {/* Mensaje de bienvenida */}
            <div className="text-muted-foreground mb-6 max-w-sm mx-auto text-center">
                <p className="font-bold text-2xl">
                    ¡Hora de la reunión!🧑‍🤝‍🧑
                </p>
                <br/> Escoge un evento y hazlo oficial agendando un tiempo
            </div>


            {/* Grid para las cards de los eventos públicos */}
            {events.length === 0 ? (
                <div className="text-center text-muted-foreground">
                    No hay eventos disponibles por ahora.
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                    {events.map((event) => (
                        // Render a card for each event
                        <PublicEventCard key={event.id} {...event} />
                    ))}
                </div>
            )}

        </div>
    )
}