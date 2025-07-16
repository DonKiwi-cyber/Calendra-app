/* Este componente se encarga de renderizar la página de Agenda del usuario. 
Una vez comprobado que el usuario ha iniciado sesión, pide la información disponible de la 
agenda del usuario a la BD, renderizándola en un componente Card, 
mostrando el componente 'ScheduleForm' con la información recuperada. 
Esto permitirá al usuario ver y gestionar su agenda desde esta página. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSchedule } from "@/server/actions/schedule"
import { auth } from "@clerk/nextjs/server"


export default async function SchedulePage() {
    // Revisa si el usuario está autenticado; caso contrario, redirecciona a la página de Inicio de sesión
    const { userId, redirectToSignIn } = await auth()
    if (!userId) return redirectToSignIn()

    // Hace una petición a la BD para capturar la agenda por medio de la función getSchedule
    const schedule = await getSchedule(userId)

    return (
            <Card className="max-w-md mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
                <CardHeader>
                    <CardTitle>Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* <ScheduleForm schedule={schedule} />  */}
                    {/* Renderiza el componente ScheduleForm con la información */}
                </CardContent>
            </Card>
    )


}