import EventCard from "@/components/cards/EventCard";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/server/actions/events";
import { auth } from "@clerk/nextjs/server";
import { CalendarPlus, CalendarRange } from "lucide-react";
import Link from "next/link";

export default async function EventsPage(){
    //Obtiene el ID del usuario autenticado
    const { userId, redirectToSignIn } = await auth()
    //Redirecciona al usuario a la página de "inicio de sesión" si no está autenticado
    if (!userId) return redirectToSignIn()

    const events = await getEvents(userId)

    return(
        <section className="flex flex-col items-center gap-16 animate-fade-in">
            {/*Título de la página y botón para crear un evento*/}
            <div className="flex gap-4 items-baseline">
                <h1 className="text-4xl xl:text-5xl font-black mb-6">
                    Eventos
                </h1>
                {/* 
                    Sin 'asChild' el botón se renderizaría como:
                        <button><a href="/dashboard">Go to Dashboard</a></button> <!-- Invalid HTML -->
                    Con él, se renderiza como:
                        <a href="/dashboard" class="...button styles...">Go to Dashboard</a> <!-- Valid HTML -->
                    Esto es útil cuando quieres que un elemento (como un <Link>) 
                    se vea y comporte como un botón sin romper la semántica de HTML.
                */}
                <Button className="bg-blue-500 hover:bg-blue-400 text-white py-6 hover:scale-110 
                duration-500 border-b-4 border-blue-700 hover:border-blue-500 rounded-2xl 
                shadow-accent-foreground text-2xl font-black"
                asChild>
                    <Link href="/events/new">
                        <CalendarPlus className="mr-4 size-7" /> Crear evento
                    </Link>
                </Button>
            </div>

            {/*Muestra los eventos existentes; en caso contrario muestra un estado vacío*/}
            {events.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-10">
                    {events.map(event => (
                    <EventCard key={event.id} {...event} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <CalendarRange className="size-16 mx-auto text-black" />
                    No tienes ningún evento todavía. Crea uno para empezar
                    <Button  
                    className="bg-blue-500 hover:bg-blue-400 text-white py-6 hover:scale-110 duration-500 border-b-4 border-blue-700 hover:border-blue-500 rounded-2xl shadow-accent-foreground shadow-2xl text-2xl font-black"
                    asChild>
                        <Link href="/events/new">
                            <CalendarPlus className="mr-4 size-7" /> New Event
                        </Link>
                    </Button>
                </div>
            )}
        </section>
    )
}