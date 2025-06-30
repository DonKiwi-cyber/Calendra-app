import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

//Geist y GeistMono son fuentes de Google utilizadas por Next. Aquí se definen como variable de manera que
//se puedan reutilizar en la página de estilos css o directamente en un componente
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

//Constante que maneja los metadatos de la página que pueden aparecer en los buscadores 
export const metadata: Metadata = {
  title: "Calendra-clon",
  description: "Esta es una práctica hecha a partir del proyecto Calendra realizado por FreeCodeCamp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //Para hacer que el programa pueda acceder a Clerk de manera global, es recomendable encerrar el contexto dentro de ClerkProvider
  return (
    <ClerkProvider> 
      <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased animate-fade-in`}
      >
        {children}
      </body>
    </html>
    </ClerkProvider>
  );
}