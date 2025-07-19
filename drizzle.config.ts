import { Config } from "drizzle-kit"

//Define la URL de la base de datos desde las variables de entorno
const databaseUrl = process.env.DATABASE_URL

//Si no existe la URL, muestra un error
if (!databaseUrl){
    throw new Error("DATABASE_URL no está definida en las variables de entorno")
}

//Exporta la configuración de Drizzle con la ayuda de "defineConfig"
export default {
    schema: "./drizzle/schema.ts", //La definición del esquema de la BD
    out: "./drizzle/migrations", //El directorio donde se mandaán los archivos de migración
} satisfies Config

