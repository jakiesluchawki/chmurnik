import { Capacitor, registerPlugin } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { interpretCloudProbabilities } from "./photo-recognition.js";

const CloudRecognizer = registerPlugin("CloudRecognizer");

const QA_PROBABILITIES = [0.05, 0.04, 0.03, 0.04, 0.03, 0.02, 0.03, 0.02, 0.56, 0.16, 0.02];

export function isPhotoRecognitionSupported() {
  return Capacitor.getPlatform() === "ios" || import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result";
}

export async function captureCloudPhoto(source) {
  const photo = await Camera.getPhoto({
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    resultType: CameraResultType.Base64,
    quality: 86,
    width: 1800,
    correctOrientation: true,
    allowEditing: false,
  });
  if (!photo.base64String) throw new Error("Nie udało się odczytać zdjęcia.");
  const format = photo.format || "jpeg";
  return {
    base64: photo.base64String,
    previewUrl: `data:image/${format};base64,${photo.base64String}`,
  };
}

export async function recognizeCloudPhoto(base64) {
  if (import.meta.env.VITE_QA_PHOTO_RECOGNITION === "result") {
    return interpretCloudProbabilities(QA_PROBABILITIES);
  }
  const native = await CloudRecognizer.classify({ base64 });
  return interpretCloudProbabilities(native.probabilities, {
    minimumConfidence: native.minimumConfidence,
    marginThreshold: native.marginThreshold,
  });
}
