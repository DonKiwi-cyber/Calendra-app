//El componente formatea la duración de un evento de un number a un string

export function formatEventDescription(durationInMinutes: number) : string {
    const hours = Math.floor(durationInMinutes / 60) //Convierte los minutos en horas
    const minutes = durationInMinutes % 60 //Obtiene los minutos restantes 
    //Convierte los minutos de number a string
    const minutesString = `${minutes} ${minutes > 1 ? "mins" : "min"}` /*Si son más de un minuto, 
    colocará la palabra "mins", en caso contrario colocará "min"*/
    //Convierte las horas de number a string
    const hoursString = `${hours} ${hours > 1 ? "hrs" : "hr"}` /*Realiza lo mismo que los minutos
    ("hrs" para muchos y "hr" para uno*/
  
    //Si no hay horas, solo regresa los minutos
    if (hours === 0) return minutesString
    //Si no hay minutos, solo regresa las horas
    if (minutes === 0) return hoursString
    //Regresa ambos
    return `${hoursString} ${minutesString}`
}

  // Obtiene el string corto para una zona horaria dada, como "+02:00"
    export function formatTimezoneOffset(timezone: string) {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        timeZoneName: "shortOffset", // Requiere la declaración para recuperar del nombre corto
      })
        .formatToParts(new Date()) // Formatea la fecha actual en partes
        .find(part => part.type == "timeZoneName")?.value // Extrae la parte de la zona horaria
    }