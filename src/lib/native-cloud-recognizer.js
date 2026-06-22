import { Capacitor, registerPlugin } from "@capacitor/core";
import { Camera, CameraDirection, MediaTypeSelection } from "@capacitor/camera";
import { interpretCloudProbabilities } from "./photo-recognition.js";

const CloudRecognizer = registerPlugin("CloudRecognizer");

const QA_PROBABILITIES = [0.05, 0.04, 0.03, 0.04, 0.03, 0.02, 0.03, 0.02, 0.56, 0.16, 0.02];

export function isPhotoRecognitionSupported() {
  return Capacitor.getPlatform() === "ios" || import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result";
}

export function buildCloudRecognizerInput(photo) {
  if (typeof photo === "string" && photo) return { base64: photo };
  if (photo?.uri) return { path: photo.uri };
  if (photo?.path) return { path: photo.path };
  if (photo?.base64) return { base64: photo.base64 };
  if (photo?.base64String) return { base64: photo.base64String };
  throw new Error("Nie udało się odczytać danych zdjęcia.");
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
    return "CHMURNIK nie ma dostępu do aparatu. Włącz Aparat w Ustawieniach iPhone’a. [0003]";
  }
  if (code === "OS-PLUG-CAMR-0005") {
    return "CHMURNIK nie ma dostępu do biblioteki zdjęć. Zmień dostęp w Ustawieniach iPhone’a. [0005]";
  }
  if (code === "OS-PLUG-CAMR-0007") {
    return "iPhone nie udostępnił aparatu tej aplikacji. [0007]";
  }
  if (code === "OS-PLUG-CAMR-0010") {
    return "Aparat nie zdołał zapisać zdjęcia. Spróbuj zrobić je ponownie. [0010]";
  }
  if (code === "OS-PLUG-CAMR-0012" || code === "OS-PLUG-CAMR-0019") {
    return `iPhone nie zdołał przygotować zdjęcia do analizy. [${code.slice(-4)}]`;
  }
  const suffix = code ? ` [${String(code).replace("OS-PLUG-CAMR-", "")}]` : "";
  return `Nie udało się odczytać tego zdjęcia.${suffix}`;
}

export async function captureCloudPhoto(source) {
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
  return normalizeCapturedPhoto(result);
}

export async function recognizeCloudPhoto(photo) {
  if (import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result") {
    return interpretCloudProbabilities(QA_PROBABILITIES);
  }
  const native = await CloudRecognizer.classify(buildCloudRecognizerInput(photo));
  return interpretCloudProbabilities(native.probabilities, {
    minimumConfidence: native.minimumConfidence,
    marginThreshold: native.marginThreshold,
  });
}
