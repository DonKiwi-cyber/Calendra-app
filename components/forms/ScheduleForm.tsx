//Componente de tipo Cliente
'use client'

import { DAYS_OF_WEEK_IN_ORDER } from "@/constants"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { scheduleFormSchema } from "@/schema/schedule"
import { timeToFloat } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { formatTimezoneOffset } from "@/lib/formatters"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Fragment } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import { saveSchedule } from "@/server/actions/schedule"

type Availability = {
    startTime: string
    endTime: string
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number]
    /* Si no se usa la aclaración [number], 
    dayOfWeek adopta como tipo todo el arreglo en lugar de un valor individual*/

  }

export function ScheduleForm({
    schedule,
}: {
    schedule?: {
        timezone: string,
        availabilities: Availability[]
    }
}) {

    // Inicializa el formulario con scheduleFormSchema y los valores predeterminados
    const form = useForm<z.infer<typeof scheduleFormSchema>>({
        resolver: zodResolver(scheduleFormSchema),
        defaultValues: {
            timezone:
                schedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
            availabilities: schedule?.availabilities.toSorted((a, b) => {
                return timeToFloat(a.startTime) - timeToFloat(b.startTime)
            }),
        },
    })

    // Gestiona los campos dinámicos para las disponibilidades utilizando useFieldArray
    const {
        append: addAvailability, // Añade una nueva disponibilidad
        remove: removeAvailability, // Remueve una disponibilidad existente
        fields: availabilityFields, // Campos de disponibilidad existentes
        // 'name' especifica la ubicación de la información (el path availabilities)
        // 'control' se conecta al objeto de control del formulario
    } = useFieldArray({ name: "availabilities", control: form.control }) 

    // Agrupa las disponibilidades por día en el contexto de la interfaz de usuario
    const groupedAvailabilityFields = Object.groupBy(
        availabilityFields.map((field, index) => ({ ...field, index })),
        availability => availability.dayOfWeek
    )

    // Gestionador de guardado de la agenda al "subir" el formulario
    async function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
        try {
            await saveSchedule(values)
            toast("Schedule saved successfully.", {
                duration: 5000,
                className: '!rounded-3xl !py-8 !px-5 !justify-center !text-green-400 !font-black',
            })
        } catch (error: any) {
            // Handle any unexpected errors that occur during the schedule saving process
            form.setError("root", {
                message: `There was an error saving your schedule${error.message}`,
            })
        }
    }

    return (
        <Form {...form}>
            <form 
            className="flex gap-6 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* Muestra un error del formulario en caso de existir */}
                {form.formState.errors.root && (
                    <div className="text-destructive text-sm">
                        {form.formState.errors.root.message}
                    </div>
                )}

                {/* Sección de la zona horaria */}
                <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zona horaria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                {/* Mostrará las distintas zonas horarias disponibles */}
                                <SelectContent>
                                    {Intl.supportedValuesOf("timeZone").map(timezone => (
                                        <SelectItem key={timezone} value={timezone}>
                                            {timezone}
                                            {` (${formatTimezoneOffset(timezone)})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {/* form grid de las disponibilidades agrupados por día */}
                <div className="grid grid-cols-[auto_auto]  gap-y-6">
                    {DAYS_OF_WEEK_IN_ORDER.map(dayOfWeek => (
                        <Fragment key={dayOfWeek}>
                            {/* Etiqueta de Día */}
                            <div className="capitalize text-sm font-semibold">
                                {dayOfWeek.substring(0, 3)}
                            </div>

                            {/* Añade una disponibilidad a un día específico */}
                            <div className="flex flex-col gap-2">
                                <Button
                                type="button"
                                className="size-6 p-1 cursor-pointer hover:scale-200"
                                variant="outline"
                                onClick={() => {
                                    addAvailability({
                                        dayOfWeek,
                                        startTime: "9:00",
                                        endTime: "17:00",
                                    })
                                }}
                                >
                                    <Plus  color="red" />
                                </Button>

                                {/* Renderiza las entradas de disponibilidad para el día */}
                                {groupedAvailabilityFields[dayOfWeek]?.map(
                                    (field, labelIndex) => (
                                        <div className="flex flex-col gap-1" key={field.id}>
                                            <div className="flex gap-2 items-center">
                                                {/* Entradas de Inicio */}
                                                <FormField
                                                control={form.control}
                                                name={`availabilities.${field.index}.startTime`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                            className="w-24"
                                                            aria-label={`${dayOfWeek} Start Time ${
                                                                labelIndex + 1
                                                            }`}
                                                            {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                                />
                                                    -
                                                {/* Entradas de Finalización */}
                                                <FormField
                                                control={form.control}
                                                name={`availabilities.${field.index}.endTime`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                            className="w-24"
                                                            aria-label={`${dayOfWeek} End Time ${
                                                                labelIndex + 1
                                                            }`}
                                                            {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                                />

                                                {/* Remover disponibilidad */}
                                                <Button
                                                type="button"
                                                className="size-6 p-1 cursor-pointer hover:bg-red-900"
                                                variant="destructive"
                                                onClick={() => removeAvailability(field.index)}
                                                >
                                                    <X />
                                                </Button>
                                            </div>

                                            {/* Muestra mensajes de validación a nivel de campo */}
                                            <FormMessage>
                                                {
                                                    form.formState.errors.availabilities?.at?.(
                                                        field.index
                                                    )?.root?.message
                                                }
                                            </FormMessage>
                                            <FormMessage>
                                                {
                                                    form.formState.errors.availabilities?.at?.(
                                                        field.index
                                                    )?.startTime?.message
                                                }
                                            </FormMessage>
                                            <FormMessage>
                                                {
                                                    form.formState.errors.availabilities?.at?.(
                                                        field.index
                                                    )?.endTime?.message
                                                }
                                            </FormMessage>
                                        </div>
                                    )
                                )}
                            </div>
                        </Fragment>
                    ))}
                </div>                  

                {/* Botón de guardado */}
                <div className="flex gap-2 justify-start">
                    <Button 
                    className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
                    disabled={form.formState.isSubmitting}
                    type="submit">
                        Guardar
                    </Button>
                </div>
            </form>
        </Form>
    )
}