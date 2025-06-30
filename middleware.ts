import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'; //Apoya con las autenticaciones de Clerk a través de la configuración de rutas seguras

const isPublicRoute = createRouteMatcher([ //Acepta o rechaza los 'Requests' que coincidan con las rutas especificadas
    "/",
    "/login(.*)",
    "/register(.*)",
    "/book(.*)"
])

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) { //Detecta si el pedido proviene de una ruta No pública
        await auth.protect() //De ser el caso, activa la protección de la autenticación, redrigiendo al usuario al módulo de Registro/Login
    }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};