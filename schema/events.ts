import { z } from "zod";

//Define un esquema de validación para los eventos utilizando Zod
export const eventFormSchema = z.object({

    name: z.string().min(1, "Required"), //El nombre es obligatorio de al menos 1 caracter
    description: z.string().optional(),
    isActive: z.boolean(), //El valor se fijará en "true" si no se da un valor

    durationInMinutes: z.coerce //La duración en minutos del evento será convertida en un número integer
      .number()
      .int()
      .positive("La duración debe ser mayor a 0 minutos")
      .max(60 * 12, `La duración debe de ser menor a 12 horas (${60 * 12} minutos)`),
})