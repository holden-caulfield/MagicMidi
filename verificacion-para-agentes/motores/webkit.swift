// Corre una prueba en un WKWebView, el WebKit del sistema: el mismo motor que
// la ventana de Tauri en macOS. Lo usa `correr.sh`; ver el LEEME.
//
// Uso: webkit <prueba.js> [captura.png]
// Variables: URL (por defecto http://localhost:1420/), OSCURO (modo oscuro).
import AppKit
import WebKit

let argumentos = CommandLine.arguments
let cuerpo = try! String(contentsOfFile: argumentos[1])
let captura = argumentos.count > 2 ? argumentos[2] : nil
let entorno = ProcessInfo.processInfo.environment
let direccion = URL(string: entorno["URL"] ?? "http://localhost:1420/")!

class Delegado: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
  var errores: [String] = []

  func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
    if m.name == "ventana" {
      let orden = "\(m.body)"
      if orden == "ocultar" {
        ventana.orderOut(nil)
      } else if orden == "mostrar" {
        ventana.orderFront(nil)
      } else if orden.hasPrefix("tamano:") {
        let medidas = orden.dropFirst(7).split(separator: ",").map { CGFloat(Double($0)!) }
        ventana.setContentSize(NSSize(width: medidas[0], height: medidas[1]))
      }
      return
    }
    errores.append("\(m.body)")
  }

  func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
    // Un segundo para que la aplicación termine de arrancar.
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
      w.callAsyncJavaScript(cuerpo, arguments: [:], in: nil, in: .page) { r in
        var salida: [String: Any] = ["errores": self.errores]
        switch r {
        case .success(let valor): salida["resultado"] = valor
        case .failure(let error): salida["excepcion"] = "\(error)"
        }
        let datos = try! JSONSerialization.data(
          withJSONObject: salida, options: [.prettyPrinted, .fragmentsAllowed])
        print(String(data: datos, encoding: .utf8)!)
        guard let ruta = captura else { exit(0) }
        w.takeSnapshot(with: nil) { imagen, _ in
          if let tiff = imagen?.tiffRepresentation, let mapa = NSBitmapImageRep(data: tiff),
            let png = mapa.representation(using: .png, properties: [:])
          {
            try? png.write(to: URL(fileURLWithPath: ruta))
          }
          exit(0)
        }
      }
    }
  }
}

let aplicacion = NSApplication.shared
aplicacion.setActivationPolicy(.accessory)
let configuracion = WKWebViewConfiguration()
let delegado = Delegado()
configuracion.userContentController.add(delegado, name: "error")
configuracion.userContentController.add(delegado, name: "ventana")
configuracion.userContentController.addUserScript(
  WKUserScript(
    source: """
        window.addEventListener('error', e => webkit.messageHandlers.error.postMessage(String(e.message)));
        window.addEventListener('unhandledrejection', e => webkit.messageHandlers.error.postMessage('rechazo: ' + String(e.reason)));
      """, injectionTime: .atDocumentStart, forMainFrameOnly: true))
let marco = NSRect(x: 0, y: 0, width: 1000, height: 700)
let vista = WKWebView(frame: marco, configuration: configuracion)
vista.navigationDelegate = delegado
if entorno["OSCURO"] != nil { vista.appearance = NSAppearance(named: .darkAqua) }
// La ventana se muestra fuera de la pantalla: tiene que estar "visible" para
// que WebKit dibuje cuadros a ritmo normal, pero sin tapar nada.
let ventana = NSWindow(contentRect: marco, styleMask: [.titled], backing: .buffered, defer: false)
ventana.contentView = vista
ventana.setFrameOrigin(NSPoint(x: -3000, y: -3000))
ventana.orderFront(nil)
vista.load(URLRequest(url: direccion))
DispatchQueue.main.asyncAfter(deadline: .now() + 120) {
  print("{\"excepcion\": \"la prueba tardó más de 120 s\"}")
  exit(1)
}
aplicacion.run()
