'use client'

import { SignIn } from "@clerk/nextjs"
import { neobrutalism } from "@clerk/themes"
import Image from "next/image"

export default function LandingPage(){
    return (
        <main className="flex items-center p-10 gap-24 animate-fade-in max-md:flex-col">
            <section className="flex flex-col items-center">
                {/*Logo de la página*/}
                <Image
                    src='/assets/logo.svg'
                    width={300}
                    height={300}
                    alt="logo"
                />

                {/*Encabezado principal*/}
                <h1 className="text-2xl font-black lg:text-3xl">
                    Tu tiempo perfectamente planeado
                </h1>

                {/*Subtítulo*/}
                <p className="font-extralight">
                    Únete a millones de profesionales en la herramienta 
                    No.1 para agendar citas y reuniones
                </p>

                {/*Imagen de acompañamiento*/}
                <Image
                    src='/assets/planning.svg'
                    width={500}
                    height={500}
                    alt="Logo"
                />
            </section>

            {/*Componente de Inicio de sesión de Clerk personalizado*/}
            <div className="mt-3">
                <SignIn
                    routing="hash" //Muestra la UI de Inicio de sesión en la página actual por enrutamiento de hash
                    appearance={{
                        baseTheme: neobrutalism //Aplica el tema 'Neobrutalista' a la UI de Inicio de sesión
                    }}
                />
            </div>
        </main>
    )
}