import PublicNavBar from "@/components/PublicNavBar"
import { currentUser } from "@clerk/nextjs/server"

export default async function MainLayout({
    children,}: {
        children: React.ReactNode
    }) {

        const user = await currentUser()

        return (
            <main className="relative">
                <PublicNavBar/>
                {/*Muestra la barra de navegación privada si hay un usuario activo, sino muestra la versión privada*/}
                {/* {user ? <PrivateNavBar/> : <PublicNavBar/>} */}
                {/*Renderiza a los hijos*/}
                <section className="pt-36">
                    {children}
                </section>
            </main>
        )
    }