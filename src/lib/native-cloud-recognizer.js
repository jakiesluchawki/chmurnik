import { Capacitor, registerPlugin } from "@capacitor/core";
import {
  Camera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";

const CloudRecognizer = registerPlugin("CloudRecognizer");

export function supportsNativeCloudRecognition() {
  return Capacitor.getPlatform() === "ios"
    || Boolean(import.meta.env.VITE_QA_PHOTO_RECOGNITION);
}

export async function chooseCloudPhoto(source) {
  if (!supportsNativeCloudRecognition()) {
    throw new Error("Rozpoznawanie zdjęć jest obecnie dostępne w aplikacji na iOS.");
  }
  const photo = await Camera.getPhoto({
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    resultType: CameraResultType.DataUrl,
    quality: 88,
    width: 1800,
    height: 1400,
    correctOrientation: true,
    allowEditing: false,
    saveToGallery: false,
    promptLabelHeader: "Zdjęcie nieba",
    promptLabelPhoto: "Wybierz z biblioteki",
    promptLabelPicture: "Zrób zdjęcie",
    promptLabelCancel: "Anuluj",
  });
  if (!photo.dataUrl) throw new Error("Nie udało się odczytać wybranego zdjęcia.");
  return photo.dataUrl;
}

export async function recognizeCloudPhoto(dataUrl) {
  if (!supportsNativeCloudRecognition()) {
    throw new Error("Rozpoznawanie zdjęć jest obecnie dostępne w aplikacji na iOS.");
  }
  return CloudRecognizer.classify({ dataUrl });
}
