//Componente de tipo Cliente
"use client"

import { VariantProps } from "class-variance-authority"
import { Button, buttonVariants } from "./ui/button"
import { CopyIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"

//Define los posibles estados del copiado
type CopyState = "idle" | "copied" | "error"

//Define las propiedades para el componente CopyEventButton
interface CopyEventButtonProps
/*Omit hace que el componente herede las propiedades de Button excepto "children y "onClick"*/
  extends Omit<React.ComponentProps<"button">, "children" | "onClick">,
    VariantProps<typeof buttonVariants> { //Permite cambiar las propiedades de variante y tamaño
  eventId: string // ID del evento
  clerkUserId: string // ID del usuario
}

// Returns the appropriate button label based on the current copy state
function getCopyLabel(state: CopyState) {
    switch (state) {
        case "copied":
            return "¡Copiado!"
        case "error":
            return "Error"
        case "idle":
        default:
            return "Copiar link"
    }
}

//Componente de botón que copia el link del evento al portapapeles
export function CopyEventButton({
    eventId,
    clerkUserId,
    className,
    variant,
    size,
    ...props //Cualquier otra propiedad
} : CopyEventButtonProps) {

    const [copyState, setCopyState] = useState<CopyState>("idle")

    const handleCopy = () => {
        const url = `${location.origin}/book/${clerkUserId}/${eventId}` // Construye el URL de agendado
    
        navigator.clipboard
          .writeText(url) // Intenta copiar el URL
          .then(() => {
            setCopyState("copied") // Al tener éxito, muestra el mensaje "Copiado"
            toast("Enlace copiado exitosamente.", {
              duration: 3000
            })
            setTimeout(() => setCopyState("idle"), 2000) // Reinicia después de dos segundos
          })
          .catch(() => {
            setCopyState("error") // Al fallar, muestra el mensaje "Error"
            setTimeout(() => setCopyState("idle"), 2000) // Reset after 2 seconds
          })
      }

    return (
        <Button
          onClick={handleCopy}
          // Aplica clases de variante y tamaño + otras clases personalizadas
          className={cn(buttonVariants({ variant, size }), 'cursor-pointer', className)} 
          variant={variant}
          size={size}
          {...props}
        >
          <CopyIcon className="size-4 mr-2" /> {/* Ícono que cambia con el estado de copiado */}
          {getCopyLabel(copyState)} {/* Etiqueta de texto que cambia con el estado de copiado */}
        </Button>
      )
}