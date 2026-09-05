import { Capacitor, registerPlugin } from "@capacitor/core";
import { Camera, CameraDirection, MediaTypeSelection } from "@capacitor/camera";
import { interpretCloudProbabilities } from "./photo-recognition.js";
import { isMacWorkspace } from "./native-workspace.js";
import { validatePhotoRegion } from "./photo-frame.js";

const CloudRecognizer = registerPlugin("CloudRecognizer");

const QA_PROBABILITIES = [0.05, 0.04, 0.03, 0.04, 0.03, 0.02, 0.03, 0.02, 0.56, 0.16, 0.02];

export function isPhotoRecognitionSupported() {
  return Capacitor.getPlatform() === "ios" || import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result";
}

export function buildCloudRecognizerInput(photo) {
  const selection = photo?.selectedRegion === true ? { selectedRegion: true } : {};
  if (typeof photo === "string" && photo) return { base64: photo };
  if (photo?.uri) return { path: photo.uri, ...selection };
  if (photo?.path) return { path: photo.path, ...selection };
  if (photo?.base64) return { base64: photo.base64, ...selection };
  if (photo?.base64String) return { base64: photo.base64String, ...selection };
  throw new Error("Nie udało się odczytać danych zdjęcia.");
}

export function normalizeCloudRegions(native) {
  if (!Array.isArray(native?.regions)) throw new Error("Brak prawidłowych propozycji obszarów.");
  const ids = new Set();
  const regions = [];
  for (const region of native.regions.slice(0, 5)) {
    try {
      validatePhotoRegion(region?.bounds);
      if (typeof region.id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(region.id) || ids.has(region.id)) continue;
      const { x, y, width, height } = region.bounds;
      const anchor = region.anchor;
      if (anchor && (![anchor.x, anchor.y].every(Number.isFinite) || anchor.x < x || anchor.y < y
        || anchor.x > x + width || anchor.y > y + height)) continue;
      ids.add(region.id);
      regions.push({ id: region.id, bounds: { x, y, width, height },
        ...(anchor ? { anchor: { x: anchor.x, y: anchor.y } } : {}) });
    } catch { /* Malformed native rectangles must never reach the photo controls. */ }
  }
  return regions;
}

export async function proposeCloudPhotoRegions(photo) {
  if (import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result") {
    // Synthetic UI fixture only; never used as detection/accuracy evidence.
    return [{ id: "qa-area-1", bounds: { x: .15, y: .2, width: .35, height: .4 } },
      { id: "qa-area-2", bounds: { x: .6, y: .3, width: .3, height: .3 } }];
  }
  return normalizeCloudRegions(await CloudRecognizer.proposeRegions(buildCloudRecognizerInput(photo)));
}

export function normalizeCapturedPhoto(result) {
  if (!result?.uri && !result?.thumbnail) {
    const error = new Error("Aparat nie zwrócił pliku zdjęcia.");
    error.code = "camera-empty-result";
    throw error;
  }
  return {
    uri: result.uri,
    base64: result.uri ? undefined : result.thumbnail,
    previewUrl: result.webPath
      || (result.uri ? Capacitor.convertFileSrc(result.uri) : `data:image/jpeg;base64,${result.thumbnail}`),
  };
}

export function isPhotoCaptureCancellation(error) {
  return ["OS-PLUG-CAMR-0006", "OS-PLUG-CAMR-0020"].includes(error?.code)
    || /cancel|anulow/i.test(String(error?.message || error || ""));
}

export function photoCaptureErrorMessage(error) {
  const code = error?.code;
  if (code === "OS-PLUG-CAMR-0003") {
    return "CHMURNIK nie ma dostępu do aparatu. Włącz Aparat w Ustawieniach urządzenia. [0003]";
  }
  if (code === "OS-PLUG-CAMR-0005") {
    return "CHMURNIK nie ma dostępu do biblioteki zdjęć. Zmień dostęp w Ustawieniach urządzenia. [0005]";
  }
  if (code === "OS-PLUG-CAMR-0007") {
    return "Urządzenie nie udostępniło aparatu tej aplikacji. [0007]";
  }
  if (code === "OS-PLUG-CAMR-0010") {
    return "Aparat nie zdołał zapisać zdjęcia. Spróbuj zrobić je ponownie. [0010]";
  }
  if (code === "OS-PLUG-CAMR-0012" || code === "OS-PLUG-CAMR-0019") {
    return `Nie udało się przygotować zdjęcia do analizy. [${code.slice(-4)}]`;
  }
  const suffix = code ? ` [${String(code).replace("OS-PLUG-CAMR-", "")}]` : "";
  return `Nie udało się odczytać tego zdjęcia.${suffix}`;
}

export async function captureCloudPhoto(source) {
  if (isMacWorkspace()) {
    return { ...normalizeCapturedPhoto(await CloudRecognizer.pickPhoto()), source: "photos" };
  }
  const commonOptions = {
    quality: 86,
    targetWidth: 1800,
    targetHeight: 1800,
    correctOrientation: true,
    editable: "no",
    includeMetadata: false,
    presentationStyle: "fullscreen",
  };
  const result = source === "camera"
    ? await Camera.takePhoto({
      ...commonOptions,
      cameraDirection: CameraDirection.Rear,
      saveToGallery: false,
    })
    : (await Camera.chooseFromGallery({
      ...commonOptions,
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: false,
      limit: 1,
    })).results?.[0];
  return { ...normalizeCapturedPhoto(result), source };
}

export async function recognizeCloudPhoto(photo) {
  if (import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result") {
    return { ...interpretCloudProbabilities(QA_PROBABILITIES), modelVersion: "qa-fixture" };
  }
  const native = await CloudRecognizer.classify(buildCloudRecognizerInput(photo));
  return { ...interpretCloudProbabilities(native.probabilities, {
    minimumConfidence: native.minimumConfidence,
    marginThreshold: native.marginThreshold,
  }), modelVersion: native.modelVersion || "unknown" };
}
