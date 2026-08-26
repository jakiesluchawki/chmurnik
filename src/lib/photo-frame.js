export function photoFrame(
  width,
  height,
  zoom = 1,
  horizontal = 50,
  vertical = 50,
) {
  if (
    ![width, height, zoom, horizontal, vertical].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    zoom < 1 ||
    zoom > 3 ||
    horizontal < 0 ||
    horizontal > 100 ||
    vertical < 0 ||
    vertical > 100
  )
    throw new RangeError("Invalid photo frame");
  const cropWidth = width / zoom;
  const cropHeight = height / zoom;
  return {
    x: ((width - cropWidth) * horizontal) / 100,
    y: ((height - cropHeight) * vertical) / 100,
    width: cropWidth,
    height: cropHeight,
  };
}

export async function prepareRecognitionFrame(source, selection) {
  const image = await new Promise((resolve, reject) => {
    const value = new Image();
    value.onload = () => resolve(value);
    value.onerror = reject;
    value.src = source;
  });
  const frame = photoFrame(
    image.naturalWidth,
    image.naturalHeight,
    selection.zoom,
    selection.horizontal,
    selection.vertical,
  );
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1600 / Math.max(frame.width, frame.height));
  canvas.width = Math.max(1, Math.round(frame.width * scale));
  canvas.height = Math.max(1, Math.round(frame.height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Nie udało się przygotować fragmentu.");
  context.drawImage(
    image,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const previewUrl = canvas.toDataURL("image/jpeg", 0.86);
  return { previewUrl, base64: previewUrl.split(",")[1] };
}
