import Capacitor
import WebKit

final class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        #if targetEnvironment(macCatalyst)
        let device = "mac"
        #else
        let device = UIDevice.current.userInterfaceIdiom == .pad ? "ipad" : "iphone"
        #endif
        // Installed before the initial navigation, so React gets the native idiom immediately.
        webView?.configuration.userContentController.addUserScript(WKUserScript(
            source: "window.__CHMURNIK_NATIVE_DEVICE__ = '\(device)';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        bridge?.registerPluginInstance(CloudRecognizerPlugin())
        bridge?.registerPluginInstance(ObservationVaultPlugin())
    }
}
