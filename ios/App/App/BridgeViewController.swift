import Capacitor
import WebKit

final class BridgeViewController: CAPBridgeViewController {
    #if !targetEnvironment(macCatalyst)
    private var frameMode = ""
    private var frameCommands: [UIKeyCommand] = []
    private static let arrows = [UIKeyCommand.inputLeftArrow: "ArrowLeft", UIKeyCommand.inputRightArrow: "ArrowRight",
                                 UIKeyCommand.inputUpArrow: "ArrowUp", UIKeyCommand.inputDownArrow: "ArrowDown"]

    fileprivate func setFrameMode(_ mode: String) {
        guard mode != frameMode else { return }
        frameCommands.forEach { removeKeyCommand($0) }
        frameCommands.removeAll()
        frameMode = mode
        guard mode == "move" || mode == "resize" else { return }
        let inputs = Array(Self.arrows.keys) + (mode == "resize" ? ["=", "-", "+"] : [])
        for input in inputs {
            for flags: UIKeyModifierFlags in (mode == "resize" ? [[], .shift] : [[]]) {
                let command = UIKeyCommand(input: input, modifierFlags: flags, action: #selector(frameKey(_:)))
                command.wantsPriorityOverSystemBehavior = true
                command.allowsAutomaticMirroring = false
                addKeyCommand(command)
                frameCommands.append(command)
            }
        }
    }

    @objc private func frameKey(_ command: UIKeyCommand) {
        guard !frameMode.isEmpty, presentedViewController == nil, let input = command.input else { return }
        // A focus change can precede delivery from UIKit. Never forward a key to the next field.
        webView?.callAsyncJavaScript("""
            const el = document.activeElement;
            if (el?.dataset?.frameKeys === mode && !el.disabled)
                el.dispatchEvent(new KeyboardEvent("keydown", {key, shiftKey, bubbles:true, cancelable:true}));
            """, arguments: ["mode": frameMode, "key": Self.arrows[input] ?? input,
                             "shiftKey": command.modifierFlags.contains(.shift)], in: nil, in: .page) { _ in }
    }

    override func viewWillDisappear(_ animated: Bool) {
        setFrameMode("")
        super.viewWillDisappear(animated)
    }
    #endif

    override func capacitorDidLoad() {
        #if targetEnvironment(macCatalyst)
        let device = "mac"
        #else
        let device = UIDevice.current.userInterfaceIdiom == .pad ? "ipad" : "iphone"
        webView?.configuration.userContentController.add(FrameFocusHandler(self), name: "chmurnikFrameFocus")
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

#if !targetEnvironment(macCatalyst)
private final class FrameFocusHandler: NSObject, WKScriptMessageHandler {
    private weak var controller: BridgeViewController?
    init(_ controller: BridgeViewController) { self.controller = controller }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        guard message.frameInfo.isMainFrame, origin.protocol == "capacitor", origin.host == "localhost",
              let mode = message.body as? String, ["", "move", "resize"].contains(mode) else { return }
        controller?.setFrameMode(mode)
    }
}
#endif
