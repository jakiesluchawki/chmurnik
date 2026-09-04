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

export function validatePhotoRegion(bounds) {
  if (!bounds || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)
    || bounds.x < 0 || bounds.y < 0 || bounds.width <= 0 || bounds.height <= 0
    || bounds.x + bounds.width > 1.000001 || bounds.y + bounds.height > 1.000001) {
    throw new RangeError("Invalid normalized photo region");
  }
  return bounds;
}

export function squarePhotoRegion(width, height, point, fraction = .55) {
  if (![width, height, point?.x, point?.y, fraction].every(Number.isFinite)
    || width <= 0 || height <= 0 || fraction < .2 || fraction > 1
    || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
    throw new RangeError("Invalid photo selection");
  }
  const side = Math.min(width, height) * fraction;
  const w = side / width;
  const h = side / height;
  return { x: Math.max(0, Math.min(1 - w, point.x - w / 2)),
    y: Math.max(0, Math.min(1 - h, point.y - h / 2)), width: w, height: h };
}

export async function prepareRecognitionRegion(source, bounds) {
  validatePhotoRegion(bounds);
  const image = await new Promise((resolve, reject) => {
    const value = new Image();
    value.onload = () => resolve(value);
    value.onerror = reject;
    value.src = source;
  });
  const width = image.naturalWidth * bounds.width;
  const height = image.naturalHeight * bounds.height;
  const scale = Math.min(1, 1600 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Nie udało się przygotować fragmentu.");
  context.drawImage(image, image.naturalWidth * bounds.x, image.naturalHeight * bounds.y,
    width, height, 0, 0, canvas.width, canvas.height);
  const previewUrl = canvas.toDataURL("image/jpeg", .9);
  return { previewUrl, base64: previewUrl.split(",")[1] };
}
