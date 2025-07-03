
import EventForm from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

//Generará un esqueleto para un formulario con el cual se crearán eventos
export default function NewPageEvent(){
    return (
        // Componente de tipo Card centrado y con un ancho máximo
        <Card className="max-w-md mx-auto border-8 border-blue-200 
        shadow-2xl shadow-accent-foreground">
          {/*Encabezado que muestra el título*/}
          <CardHeader>
            <CardTitle>Nuevo evento</CardTitle>
          </CardHeader>
    
          {/*Sección de contenido del evento*/}
          <CardContent>
            <EventForm/>
          </CardContent>
        </Card>
      )
}