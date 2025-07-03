//Componente de tipo Cliente
'use client'

import { eventFormSchema } from "@/schema/events"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Switch } from "../ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { Button } from "../ui/button"
import Link from "next/link"
import { useTransition } from "react"
import { createEvent, deleteEvent, updateEvent } from "@/server/actions/actions"

//Este componente gestionará las acciones de tipo CRUD para los eventos
export default function EventForm({
    event,
}:  {
        //Define la forma de los datos del evento
        event?: { // objeto de tipo Evento. Es opcional ya que puede no estar al crear uno nuevo
        id: string 
        name: string 
        description?: string 
        durationInMinutes: number
        isActive: boolean 
        }
    }
){

    // useTransition es un 'React hook' que ayuda a gestionar los estados de transición en operaciones asíncronas
    // Regresa dos valores:
    // 1. `isDeletePending` - Un booleano que nos dice si la eliminación sigue en progreso
    // 2. `startDeleteTransition` - Una función que podemos usar para iniciar la operación asíncrona, como eliminar el evento en este caso

    const [isDeletePending, startDeleteTransition] = useTransition()

    //Crea y maneja un objeto Form, el cual será moldeado en base a la estructura de "eventsFormSchema"
    const form = useForm<z.infer<typeof eventFormSchema>>({
        resolver: zodResolver(eventFormSchema), // Valida el esquema
        defaultValues: event ? {
            //Si existe el evento, deja sus datos como predeterminados (modo de edición)
            ...event,
          }
          : {
            //Si no existe, fijará los siguientes valores (modo de creación)
            isActive: true,             //Activo por defecto
            durationInMinutes: 30,      //La duración por defecto es 30 minutos
            description: '',            
            name: '',                   
          },
    })

    //Función que maneja las actividades de la acción 'submit' del formulario
    async function onSubmit(values: z.infer<typeof eventFormSchema>) {
        //action será una función de tipo Servidor que decidirá si crear o editar un evento dependiendo de si existe o no
        const action =  event == null ? createEvent : updateEvent.bind(null, event.id)
        try {
            await action(values)

        } catch (error: any) {
            //Maneja y muestra cualquier evento que ocurra durnte el guardado/editado
          form.setError("root", {
            message: `Ocurrió un evento al guardar el evento ${error.message}`,
          })
        }
    }

    return (
        <Form {...form}>
            <form
            onSubmit={form.handleSubmit(onSubmit)} //Ejecutará la acción onSubmit cuando se complete el formulario
            className="flex gap-6 flex-col"
            >
                {/*Muestra los errores que puedan ocurrir*/}
                {form.formState.errors.root && (
                <div className="text-destructive text-sm">
                    {form.formState.errors.root.message}
                </div>
                )}

                {/*Campo de nombre del evento*/}
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>
                            El nombre que los usuarios verán dentro de la agenda
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
                />

                {/*Campo de la duración del evento*/}
                <FormField
                control={form.control}
                name="durationInMinutes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Duracion</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>En minutos</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
                />

                {/*Campo de la descripción del evento*/}
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descripcion</FormLabel>
                        <FormControl>
                            <Textarea className="resize-none h-32" {...field} />
                        </FormControl>
                        <FormDescription>
                            Descripción opcional
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
                />

                {/*Switch para activar/desactivar el evento*/}
                <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel>Activo</FormLabel>
                        </div>
                        <FormDescription>
                            Los eventos inactivos no podrán ser agendados por los usuarios
                        </FormDescription>
                    </FormItem>
                )}
                />

                {/*Sección de los botones: Guardar, Eliminar y Cancelar */}
                <div className="flex gap-2 justify-end">
                {/*Botón para eliminar evento (solo se mostrará si se está editando un evento existente*/}
                {event && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            {/*Esta es la sección del botón en el formulario de evento*/}
                            <Button
                            className="cursor-pointer hover:scale-105 hover:bg-red-700"
                            variant="destructive"
                            disabled={isDeletePending || form.formState.isSubmitting}
                            >
                                Eliminar
                            </Button>
                        </AlertDialogTrigger>
                        {/*Cuadro de texto que aparecerá cuando se pulse el botón Eliminar*/}
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                {/*Título y cuerpo del mensaje*/}
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    No podrás deshacer esta acción.
                                    El evento se eliminará permanentemente
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                {/*Botón para cancelar la eliminación*/}
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                {/*Botón para afirmar la eliminación*/}
                                <AlertDialogAction
                                className="bg-red-500 hover:bg-red-700 cursor-pointer"
                                disabled={isDeletePending || form.formState.isSubmitting}
                                onClick={() => {
                                    // Start a React transition to keep the UI responsive during this async operation
                                    startDeleteTransition(async () => {
                                        try {
                                            // Attempt to delete the event by its ID
                                            await deleteEvent(event.id)
                                        } catch (error: any) {
                                            // If something goes wrong, show an error at the root level of the form
                                            form.setError("root", {
                                                message: `Ocurrió un error al intentar eliminar el evento: 
                                                ${error.message}`,
                                            })
                                        }
                                    })
                                }}>
                                    Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {/*Botón para cancelar la creación/edición del evento (redirige a la página de los eventos)*/}
                <Button
                    disabled={isDeletePending || form.formState.isSubmitting}
                    type="button"
                    asChild
                    variant="outline"
                >
                    <Link href="/events">Cancelar</Link>
                </Button>

                {/*Botón para guardar el evento*/}
                <Button
                className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
                    disabled={isDeletePending || form.formState.isSubmitting}
                    type="submit"
                >
                    Guardar
                </Button>
                </div>
            </form>
        </Form>
    )
}