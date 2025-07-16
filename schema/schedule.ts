import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { timeToFloat } from "@/lib/utils";
import { z } from "zod";

export const scheduleFormSchema = z.object({
    timezone: z.string().min(1, "Required"), // timezone debe ser un string no vacío
    availabilities: z // El campo es un arreglo
        .array( // El arreglo contiene objetos con las siguientes propiedades
            z.object({
                dayOfWeek: z.enum(DAYS_OF_WEEK_IN_ORDER), // 'dayOfWeek' debe de ser un valor de DAYS_OF_WEEK_IN_ORDER
                startTime: z // 'startTime' debe de ser un string que cumpla con el formato de 24 hrs (HH:MM)
                    .string()
                    .regex(
                        /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, // Patrón para establecer el tiempo al formato de 24 hrs
                        "El tiempo debe de ser en formato HH:MM" // Error en caso de que no coincida el formato

                        // ❌ Ejemplos de formatos inválidos:
                        // 9:15 (Las horas deben de ser dos dígitos)
                        // 24:00 (24 no es válido dentro del formato, solo 00 o 12)
                        // 12:60 (Los minutos no llegan a 60)
                        // 03:5 (Los minutos deben de ser dos dígitos)
                    ),
                endTime: z // El valor 'endTime' sigue el mismo formato que 'startTime'
                    .string()
                    .regex(
                        /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
                        "El tiempo debe de ser en formato HH:MM"
                    ),
            })
        )

        /* Esta propiedad asegura que los tiempos de disponibilidad no sean negativos o
        permitir que coexistan dos disponibilidades en el mismo día y con horas sobrepuestas*/
        .superRefine((availabilities, ctx) => { // Agrega validaciones adicionales a la función
            availabilities.forEach((availability, index) => { // Recorre cada "disponibilidad" dentro del arreglo
                const overlaps = availabilities.some((a, i) => { // Revisa si la disponibilidad se superpone con otra
                    return (
                        i !== index && // Se asegura de que no se esté comparando consigo mismo
                        a.dayOfWeek === availability.dayOfWeek && // Revisa si es el mismo día de la semana
                        // Si a.dayOfWeek === availability.dayOfWeek es verdad entonces se realiza la comparación
                        // No es importante comparar dos tiempos si no están en el mismo día

                        // Revisa si el tiempo de inicio sucede antes que el tiempo de finalización
                        timeToFloat(a.startTime) < timeToFloat(availability.endTime) && 
                        // Y si el tiempo de finalización es después del tiempo de inicio
                        timeToFloat(a.endTime) > timeToFloat(availability.startTime) 
                    )
                })
            // La función 'some()' se usa aquí para revisar si alguna de las dinponibilidades se superpone con la actual (en el índex)
            // some() hace un ciclo del arreglo de availabilities
            // Por cada availability a, revisa si:
                // No es el mismo objeto
                // No es el mismo día
                // El rango de tiempo no se superpone
                // Si todos los objetos del arreglo cumplen con las condiciones, some() regresará un True

            if (overlaps) {
                ctx.addIssue({
                    // Error de validación personalizado
                    code: "custom",
                    message: "La disponibilidad choca con otra existente",
                    path: [index, "startTime"], // ⬅️ This attaches error to startTime field
                })
            }

            if (
                timeToFloat(availability.startTime) >= timeToFloat(availability.endTime)
            )  {
                ctx.addIssue({
                    code: "custom",
                    message: "El tiempo de fin debe de ser después del tiempo de inicio", 
                    path: [index, "endTime"], 
                })
            }
            })
        }),
})