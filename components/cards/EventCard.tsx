import Link from "next/link"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { cn } from "@/lib/utils"
import { formatEventDescription } from "@/lib/formatters"
import { CopyEventButton } from "../CopyEventButton"

//Definición del tipo de la propiedad EventCard
type EventCardProps = {
    id: string
    isActive: boolean
    name: string
    description: string | null
    durationInMinutes: number
    clerkUserId: string
  }

//Componente que muestra un componente de carta de Evento
export default function EventCard ({
    id,
    isActive,
    name,
    description,
    durationInMinutes,
    clerkUserId,
}: EventCardProps) {
    return (
        <Card className={cn("flex flex-col border-4 border-blue-500/10 shadow-2xl transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110", !isActive && " bg-accent border-accent")}>
            {/*Encabezado y duración del Card*/}
            <CardHeader className={cn(!isActive && "opacity-50")}>
                <CardTitle>{name}</CardTitle>
                <CardDescription>
                    {formatEventDescription(durationInMinutes)}
                </CardDescription>
            </CardHeader>
    
            {/*Muestra la descripción si es que existe una*/}
            {description != null && (
            <CardContent className={cn(!isActive && "opacity-50")}>
                {description}
            </CardContent>
            )}
    
            {/*Pie del Card con los botones Copiar y Editar*/}
            <CardFooter className="flex justify-end gap-2 mt-auto">
                {/*Muestra el botón de copiar sólo si el evento está activo*/}
                {isActive && (
                    <CopyEventButton
                    variant="outline"
                    eventId={id}
                    clerkUserId={clerkUserId}
                    />
                )}
            {/*Botón de Editar*/}
            <Button 
            className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
            asChild>
                <Link href={`/events/${id}/edit`}>Edit</Link>
            </Button>
          </CardFooter>
        </Card>
      )
}