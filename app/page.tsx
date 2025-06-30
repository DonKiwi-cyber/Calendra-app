import LandingPage from "@/components/LandingPage";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {

  const user = await currentUser()

  //Si no existe algún usuario activo, se mostrará la página de bienvenida pública
  if (!user) return <LandingPage/>
  
  return redirect('/events')
}
