import { Capacitor, registerPlugin } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { interpretCloudProbabilities } from "./photo-recognition.js";

const CloudRecognizer = registerPlugin("CloudRecognizer");

const QA_PROBABILITIES = [0.05, 0.04, 0.03, 0.04, 0.03, 0.02, 0.03, 0.02, 0.56, 0.16, 0.02];

export function isPhotoRecognitionSupported() {
  return Capacitor.getPlatform() === "ios" || import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result";
}

export function buildCloudRecognizerInput(photo) {
  if (typeof photo === "string" && photo) return { base64: photo };
  if (photo?.path) return { path: photo.path };
  if (photo?.base64) return { base64: photo.base64 };
  if (photo?.base64String) return { base64: photo.base64String };
  throw new Error("Nie udało się odczytać danych zdjęcia.");
}

export function cameraPermissionGranted(state) {
  return state === "granted" || state === "limited";
}

async function ensureCameraPermission(source) {
  if (source !== "camera") return;
  let permission = await Camera.checkPermissions();
  if (!cameraPermissionGranted(permission.camera)) {
    permission = await Camera.requestPermissions({ permissions: ["camera"] });
  }
  if (!cameraPermissionGranted(permission.camera)) {
    const error = new Error("Dostęp do aparatu jest wyłączony. Włącz go w Ustawieniach iPhone’a dla CHMURNIKA.");
    error.code = "camera-permission-denied";
    throw error;
  }
}

export async function captureCloudPhoto(source) {
  await ensureCameraPermission(source);
  const photo = await Camera.getPhoto({
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    resultType: CameraResultType.Uri,
    quality: 86,
    width: 1800,
    correctOrientation: true,
    allowEditing: false,
    saveToGallery: false,
  });
  if (!photo.path && !photo.base64String) throw new Error("Aparat nie zwrócił pliku zdjęcia.");
  return {
    path: photo.path,
    base64: photo.base64String,
    previewUrl: photo.webPath || (photo.base64String
      ? `data:image/${photo.format || "jpeg"};base64,${photo.base64String}`
      : Capacitor.convertFileSrc(photo.path)),
  };
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
