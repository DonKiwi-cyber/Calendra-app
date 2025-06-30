import { defineConfig } from "drizzle-kit"

//Define la URL de la base de datos desde las variables de entorno
const databaseUrl = process.env.DATABASE_URL

//Si no existe la URL, muestra un error
if (!databaseUrl){
    throw new Error("DATABASE_URL no está definida en las variables de entorno")
}

//Exporta la configuración de Drizzle con la ayuda de "defineConfig"
export default defineConfig({
    schema: "./drizzle/schema.ts", //La definición del esquema de la BD
    out: "./drizzle/migrations", //El directorio donde se mandaán los archivos de migración
    dialect: "postgresql", //El lenguaje que manejará la BD
    strict: true, //Activa las validaciones estrictas y de tipo seguro
    verbose: true, //Permite el logging verbal para obtener más información durante las acciones del Cliente
    dbCredentials: {
        url: databaseUrl
    }
})