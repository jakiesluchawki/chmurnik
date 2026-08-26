import { postcardCaption } from "./observations.js";

export async function createObservationPostcard(entry, source) {
  if (!source) throw new Error("Do pocztówki potrzebne jest zdjęcie.");
  await document.fonts.ready;
  const image = await new Promise((resolve, reject) => {
    const value = new Image();
    value.onload = () => resolve(value);
    value.onerror = reject;
    value.src = source;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context || !image.naturalWidth || !image.naturalHeight)
    throw new Error("Nie udało się przygotować pocztówki.");
  const caption = postcardCaption(entry);
  context.fillStyle = "#ffe1eb";
  context.fillRect(0, 0, 1080, 1350);
  context.fillStyle = "#6d6435";
  context.font = '700 30px "Roobert", sans-serif';
  context.fillText("CHMURNIK / MOJE NIEBO", 56, 74);
  context.font = '24px "Roobert", sans-serif';
  context.textAlign = "right";
  context.fillText(caption.date, 1024, 74);
  context.textAlign = "left";
  context.fillStyle = "#fff7f1";
  context.fillRect(40, 116, 1000, 840);
  const scale = Math.min(952 / image.naturalWidth, 792 / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  // Preserve the entire photographic frame, not a silently cropped identification.
  context.drawImage(
    image,
    (1080 - width) / 2,
    140 + (792 - height) / 2,
    width,
    height,
  );
  context.fillStyle = "#6d6435";
  context.font = '27px "Roobert", sans-serif';
  context.fillText(caption.status, 56, 1014);
  let size = 76;
  do {
    context.font = `${size}px "Romie", Georgia, serif`;
    size -= 2;
  } while (context.measureText(caption.title).width > 968 && size > 30);
  context.fillText(caption.title, 56, 1114, 968);
  context.strokeStyle = "#6d6435";
  context.globalAlpha = 0.3;
  context.beginPath();
  context.moveTo(56, 1200);
  context.lineTo(1024, 1200);
  context.stroke();
  context.globalAlpha = 1;
  context.font = '27px "Roobert", sans-serif';
  context.fillText("Zauważ. Zrozum. Zachowaj.", 56, 1265);
  context.textAlign = "right";
  context.fillText("chmurnik.cloud", 1024, 1265);
  return canvas.toDataURL("image/jpeg", 0.88);
}
