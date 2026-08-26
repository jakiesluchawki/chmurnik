import React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App } from "./App.jsx";
import "./styles.css";
import "./zgrywa.css";
import "./field.css";

const isNative = Capacitor.isNativePlatform();

if (isNative || import.meta.env.VITE_QA_NATIVE_LAYOUT === "1") {
  document.documentElement.classList.add("native-ios");
}
if (isNative) {
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (isNative) {
  window.addEventListener("load", () => {
    requestAnimationFrame(() => {
      SplashScreen.hide({ fadeOutDuration: 320 }).catch(() => {});
    });
  });
} else if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`)
      .then((registration) => {
        const announce = () => window.dispatchEvent(new CustomEvent("chmurnik:update-ready", {
          detail: registration,
        }));
        if (registration.waiting) announce();
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          installing?.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) announce();
          });
        });
      })
      .catch(() => {});

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window.__chmurnikReloadAfterUpdate) window.location.reload();
    });
  });
}
