import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema"

//Inicia el cliente Neon usando la URL de la base de datos en las variables de entorno
const sql = neon(process.env.DATABASE_URL!)

//Crea y exporta el ORM de Drizzle con con el cliente y esquema de Neon para peticiones seguras
export const db = drizzle(sql, {schema})