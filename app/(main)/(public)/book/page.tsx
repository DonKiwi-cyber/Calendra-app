'use client' //Componente de tipo CLiente

import Loading from "@/components/Loading"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"

export default function PublicPage() {
  const { user, isLoaded } = useUser()  // Usa 'isLoaded' para saber si la información del usuario está disponible

  if (!isLoaded) {
    return <Loading /> //Despliega el componente 'Loading' hasta que la información sea recuperada
  }

  if (!user) {
    return redirect('/login') // Regresa al login si no hay un usuario actual
  }

  // Una vez que todo esté completo, se redirecciiona a la página de Public profile
  return redirect(`/book/${user.id}`)
}