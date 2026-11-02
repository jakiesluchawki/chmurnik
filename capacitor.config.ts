import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cloud.chmurnik.app",
  appName: "CHMURNIK",
  webDir: "dist",
  backgroundColor: "#f6dfe8",
  ios: {
    backgroundColor: "#f6dfe8",
    contentInset: "never",
    preferredContentMode: "mobile",
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      // The overlay disables interaction with WKWebView until it is removed.
      launchAutoHide: true,
      launchShowDuration: 1500,
      launchFadeOutDuration: 320,
      backgroundColor: "#f6dfe8",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
    },
  },
};

export default config;
