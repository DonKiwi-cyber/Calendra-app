/* El componente `MeetingForm`, es un formulario del lado del cliente construido con las validaciones
`react-hook-form` y `zod`, permitiendo a los usuarios agendar una reunión seleccionando
una zona horaria, fecha y hora; ingresando sus nombres, emails y notas opcionales. 
Utiliza varios componentes de interfaz de usuario personalizados (como `Select`, `Calendar` y `Popover`) 
para una experiencia más natural. 
Los filtros permiten horas de reunión (`validTimes`) basados en la fecha y zona horaria del usuario, 
asegurando que solo opciones válidas sean mostradas. Una vez subida la información, 
la envía junto con el `eventId` y el `clerkUserId` a una función backend (`createMeeting`) 
para crear la reunión, 
y maneja cualquier error de parte del servidor mostrándolo en la interfaz de usuario.*/

'use client'

import { meetingFormSchema } from "@/schema/meetings"
import { createMeeting } from "@/server/actions/meetings"
import { zodResolver } from "@hookform/resolvers/zod"
import { toZonedTime } from "date-fns-tz"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { formatDate, formatTimeString, formatTimezoneOffset } from "@/lib/formatters"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"
import { isSameDay } from "date-fns"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import Link from "next/link"
import Booking from "../Booking"


 // Enables client-side rendering for this component

export default function MeetingForm({
  validTimes,
  eventId,
  clerkUserId,
}: {
  validTimes: Date[] // Lista predefinida de los tiempos disponibles
  eventId: string     // Id del evento asociado con la reunión 
  clerkUserId: string // Id del usuario del sistema de autenticación
}) {

  const router = useRouter()

  // Inicializa el formulario usando el esquema React Hook Form y Zod
  // Crea el formulario usando React Hook Form con Zod para las validaciones
  const form = useForm<z.infer<typeof meetingFormSchema>>({
    // Utiliza zodResolver para conectar el esquema de Zod al React Hook Form
    resolver: zodResolver(meetingFormSchema),
    
    // Establece los valores por defecto al iniciar los campos del formulario
    defaultValues: {
      // Detecta automáticamente la zona horaria del usuario
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
      // Inicia los campos vacíos para la información del anfitrión
      guestName: "",
      guestEmail: "",
      guestNotes: "",
    },
  })

  // Zona horaria y campos de fechas seleccionados para las actualizaciones
  const timezone = form.watch("timezone")
  const date = form.watch("date")

  // Convierte los tiempos válidos a la zona horaria seleccionada
  // useMemo() procesará nuevamente los valores cuando sus propiedades cambien,
  // es decir, cuando la zona horaria del usuario cambie
  const validTimesInTimezone = useMemo(() => {
    return validTimes.map(date => toZonedTime(date, timezone))
  }, [validTimes, timezone])

  // Manejar la subida de datos
  async function onSubmit(values: z.infer<typeof meetingFormSchema>) {
    try {
      // Llama a la acción createMeeting()
      const meetingData =  await createMeeting({
        ...values,
        eventId,
        clerkUserId,
      })
      // Inicializa el path de la variable para usarla después en el bloque final
      const path = `/book/${meetingData.clerkUserId}/${meetingData.eventId}/success?startTime=${meetingData.startTime.toISOString()}`;
      router.push(path)
    
    } catch (error: any) {
      // Maneja cualquier error que ocurra durante la creación de la reunión
      form.setError("root", {
        message: `Ocurrió un error al guardar el evento ${error.message}`,
      })
    }
  }

  if (form.formState.isSubmitting) return <Booking/>

  return (
    <Form {...form}>
      <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex gap-6 flex-col"
      >
        {/* Muestra un mensaje de error si la subida de datos falla */}
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
        
        {/* Campo de selección de zona horaria */}
        <FormField
        control={form.control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zona horaria</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {/* Muestra todas las zonas horarias disponibles */}
                {Intl.supportedValuesOf("timeZone").map(timezone => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone}
                    {` (${formatTimezoneOffset(timezone)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage/>
          </FormItem>
        )}
      />
        
      <div className="flex gap-4 flex-col md:flex-row">
        {/* Campo de elección de fechas */}
        <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <Popover>
            <FormItem className="flex-1">
              <FormLabel>Fecha</FormLabel>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                  variant="outline"
                  className={cn(
                    "pl-3 text-left font-normal flex w-full",
                    !field.value && "text-muted-foreground"
                  )}
                  >
                    {field.value ? (
                      formatDate(field.value)
                    ) : (
                      <span>Escoge una fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={date =>
                  // Solo permite seleccionar fechas con espacios de tiempo disponibles
                  !validTimesInTimezone.some(time =>
                    isSameDay(date, time)
                  )
                }
                initialFocus
                />
              </PopoverContent>
              <FormMessage />
            </FormItem>
          </Popover>
        )}
        />
        
        {/* Campo de selección de hora */}
        <FormField
        control={form.control}
        name="startTime"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Hora</FormLabel>
            <Select
            disabled={date == null || timezone == null}
            onValueChange={value =>
              field.onChange(new Date(Date.parse(value)))
            }
            defaultValue={field.value?.toISOString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                  placeholder={
                    date == null || timezone == null
                    ? "Select a date/timezone first"
                    : "Select a meeting time"
                  }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {/* Muestra las opciones de tiempo para el día seleccionado */}
                {validTimesInTimezone
                  .filter(time => isSameDay(time, date))
                  .map(time => (
                    <SelectItem
                    key={time.toISOString()}
                    value={time.toISOString()}
                    >
                    {formatTimeString(time)}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
        />
      </div>
        
      <div className="flex gap-4 flex-col md:flex-row">
        {/* Inserción del nombre del anfitrión */}
        <FormField
        control={form.control}
        name="guestName"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Tu nombre</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
        />  
      
        {/* Inserción del email del anfitrión */}
        <FormField
        control={form.control}
        name="guestEmail"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Tu correo electrónico</FormLabel>
            <FormControl>
              <Input type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
        />  
      </div>
        
      {/* Textarea de las notas */}
      <FormField
      control={form.control}
      name="guestNotes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notas</FormLabel>
          <FormControl>
            <Textarea className="resize-none" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
      />
        
      {/* Botones de guardado y cancelación */}
      <div className="flex gap-2 justify-end">
        <Button
        disabled={form.formState.isSubmitting}
        type="button"
        asChild
        variant="outline"
        >
          <Link href={`/book/${clerkUserId}`}>Cancelar</Link>
        </Button>
        <Button 
        className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
        disabled={form.formState.isSubmitting} 
        type="submit"
        >
          Agendar evento
        </Button>
      </div>
    </form>
  </Form>
  )
}
