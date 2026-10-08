// Manda y escucha mensajes MIDI por los puertos del sistema, como el IAC
// Driver, para probar el flujo completo con la aplicación abierta. Lo usa
// `midi.sh`; ver el LEEME.
//
// Uso: midi listar
//      midi mandar <destino> <byte en hex>...
//      midi escuchar <origen> [segundos]
// Un puerto se elige por su nombre o por su identificador, que es el mismo que
// usa la aplicación: el uniqueID de CoreMIDI sin signo, como lo da midir.
import CoreMIDI
import Foundation

struct Puerto {
  let extremo: MIDIEndpointRef
  let id: String
  let nombre: String
}

func puertos(_ cantidad: Int, _ extremo: (Int) -> MIDIEndpointRef) -> [Puerto] {
  (0..<cantidad).map { indice in
    let e = extremo(indice)
    var id: Int32 = 0
    MIDIObjectGetIntegerProperty(e, kMIDIPropertyUniqueID, &id)
    var nombre: Unmanaged<CFString>?
    MIDIObjectGetStringProperty(e, kMIDIPropertyDisplayName, &nombre)
    return Puerto(
      extremo: e, id: String(UInt32(bitPattern: id)),
      nombre: nombre?.takeRetainedValue() as String? ?? "")
  }
}

let destinos = puertos(MIDIGetNumberOfDestinations(), MIDIGetDestination)
let origenes = puertos(MIDIGetNumberOfSources(), MIDIGetSource)

func fallar(_ mensaje: String) -> Never {
  FileHandle.standardError.write((mensaje + "\n").data(using: .utf8)!)
  exit(1)
}

func elegir(_ busqueda: String, entre lista: [Puerto], _ tipo: String) -> Puerto {
  if let porId = lista.first(where: { $0.id == busqueda }) { return porId }
  let porNombre = lista.filter { $0.nombre == busqueda }
  if porNombre.count == 1 { return porNombre[0] }
  if porNombre.isEmpty { fallar("No hay ningún \(tipo) '\(busqueda)'. Ver `listar`.") }
  let ids = porNombre.map(\.id).joined(separator: ", ")
  fallar("Hay \(porNombre.count) \(tipo)s '\(busqueda)' (\(ids)): elegí uno por su identificador.")
}

func hex(_ bytes: some Sequence<UInt8>) -> String {
  bytes.map { String(format: "%02X", $0) }.joined(separator: " ")
}

var cliente = MIDIClientRef()
MIDIClientCreate("verificacion-para-agentes" as CFString, nil, nil, &cliente)

let argumentos = Array(CommandLine.arguments.dropFirst())
switch argumentos.first {
case "listar":
  print("Destinos (para mandar):")
  for p in destinos { print("  \(p.id)  \(p.nombre)") }
  print("Orígenes (para escuchar):")
  for p in origenes { print("  \(p.id)  \(p.nombre)") }

case "mandar" where argumentos.count > 2:
  let destino = elegir(argumentos[1], entre: destinos, "destino")
  // Cada argumento puede traer varios bytes: "90 3C 64" o 90 3C 64.
  let bytes = argumentos.dropFirst(2).flatMap { $0.split(separator: " ") }.map { texto in
    guard texto.count <= 2, let byte = UInt8(texto, radix: 16) else {
      fallar("'\(texto)' no es un byte en hex.")
    }
    return byte
  }
  var salida = MIDIPortRef()
  MIDIOutputPortCreate(cliente, "salida" as CFString, &salida)
  let paquetes = MIDIPacketList.Builder(byteSize: 1024 + bytes.count)
  paquetes.append(timestamp: 0, data: bytes)
  paquetes.withUnsafePointer { _ = MIDISend(salida, destino.extremo, $0) }
  print("\(hex(bytes)) → \(destino.nombre) (\(destino.id))")

case "escuchar" where argumentos.count > 1:
  let origen = elegir(argumentos[1], entre: origenes, "origen")
  if argumentos.count > 2 {
    guard let segundos = Double(argumentos[2]) else {
      fallar("'\(argumentos[2])' no es una cantidad de segundos.")
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + segundos) { exit(0) }
  }
  // Una línea por paquete, apenas llega, aunque la salida vaya a un archivo.
  setvbuf(stdout, nil, _IOLBF, 0)
  let formato = DateFormatter()
  formato.dateFormat = "HH:mm:ss.SSS"
  var entrada = MIDIPortRef()
  MIDIInputPortCreateWithBlock(cliente, "entrada" as CFString, &entrada) { lista, _ in
    for paquete in lista.unsafeSequence() {
      print("\(formato.string(from: Date()))  \(hex(paquete.bytes()))")
    }
  }
  MIDIPortConnectSource(entrada, origen.extremo, nil)
  FileHandle.standardError.write(
    "Escuchando \(origen.nombre) (\(origen.id)).\n".data(using: .utf8)!)
  dispatchMain()

default:
  fallar(
    """
    Uso: midi listar
         midi mandar <destino> <byte en hex>...
         midi escuchar <origen> [segundos]
    """)
}
