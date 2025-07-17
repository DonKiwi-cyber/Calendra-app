
import PublicProfile from "@/components/PublicProfile"
import { clerkClient } from "@clerk/nextjs/server"


export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ clerkUserId: string }> //Extrae el id del usuario de los parámetros del buscador
}) {
  const { clerkUserId } = await params
  const client = await clerkClient()
  const user = await client.users.getUser(clerkUserId)
  const { fullName } = user // Extrae el nombre completo del usuario 

  // Muestra el componente de PublicProfile
  return <PublicProfile userId={clerkUserId} fullName={fullName} />
}
