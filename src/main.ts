import { inicializarConexion } from "@/conexion/conexion";
import "@/ventana/ventana-principal";
import { inicializarWorkflow } from "@/workflow/ejecutar";

await inicializarWorkflow();
await inicializarConexion();
