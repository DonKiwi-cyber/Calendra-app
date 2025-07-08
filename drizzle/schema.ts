import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { relations } from "drizzle-orm";
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

//Crea un valor de tiempo reusable fijado en el momento de creación del evento
const createdAt = timestamp("createdAt").notNull().defaultNow()

//Crea un valor de tiempo que cambia cada vez que el evento es alterado/actualizado
const updatedAt = timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date())

//Define la tabla "events" con los campos "name", "description" y "duration"
export const EventTable = pgTable(
    "events", //nombre de la tabla
    {
        id: uuid("id").primaryKey().defaultRandom(),
        //id única con un Identificador Único Universal (UUID) por defecto
        //uuid(id): define una columna nombrada "id" con el tipo UUID
        //primaryKey(): hace este valor la llave primaria
        //defaultRandom(): si no ingresa un valor, se generará uno de tipo UUID automáticamente

        name: text("name").notNull(), //Nombre del evento. No puede estar vacía
        description: text("description"), //Descripción del evento 
        durationInMinutes: integer("durationInMinutes").notNull(), //Duración del evento en minutos. No puede estar vacío
        clerkUserId: text("clerkUserId").notNull(), //El ID del usuario que creó el evento
        isActive: boolean("isActive").notNull().default(true), //Marca si el evento está o no activo, está marcado "verdadero" por defecto
        createdAt,
        updatedAt,
    },
    table => ([
        index("clerkUserIdIndex").on(table.clerkUserId), //Enlaza el valor clerkUserId para peticiones sql más rápidas
    ])
)

//Define la tabla "schedules", una por usuario, con zona horaria y tiempo
export const ScheduleTable = pgTable(
    "schedules", {
        id: uuid("id").primaryKey().defaultRandom(),
        timezone: text("timezone").notNull(), //marca la zona horaria
        clerkUserId: text("clerkUserId").notNull().unique(),
        createdAt,
        updatedAt,
    }
)

//Define una enumeración para los días de la semana
export const scheduleDayOfWeekEnum = pgEnum(
    "day", DAYS_OF_WEEK_IN_ORDER
)

//Define la tabla "schedulesAvailability", que guarda los espacios de tiempo disponibles al día
export const SchedulesAvailabilityTable = pgTable(
    "schedulesAvailability", {
        id: uuid("id").primaryKey().defaultRandom(),
        scheduleId: uuid("scheduleId").notNull().references(() => // Hace referencia al ID de una agenda (llave foránea)
            ScheduleTable.id, {onDelete: "cascade"} // "cascade" significa que la fila entera será eliminada cuando el valor original sea borrado
        ),
        startTime: text("startTime").notNull(), // Tiempo de inicio de disponibilidad
        endTime: text("endTime").notNull(), // Tiempo de finalización de disponibilidad
        dayOfWeek: scheduleDayOfWeekEnum("dayOfWeek").notNull(), //día de la semana
    },
    table => ([
        index("scheduleInIndex").on(table.scheduleId)
    ])
)

//Define las relaciones para la tabla ScheduleTable: una agenda tiene muchas disponibilidades
export const ScheduleRelations = relations(ScheduleTable, ({many}) => ({
    availabilities: many(SchedulesAvailabilityTable) //relación uno a muchos
}))

//Define la relación inversa: cada disponibilidad pertenece a una agenda
export const scheduleAvailabilityRelations = relations(
    SchedulesAvailabilityTable,
    ({one}) => ({
        schedule: one(ScheduleTable, {
            fields: [SchedulesAvailabilityTable.scheduleId], //Llave primaria local
            references: [ScheduleTable.id], //Llave foránea
        })
    })
)