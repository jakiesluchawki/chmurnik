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

export function squareRegionForProposal(width, height, bounds, anchor) {
  validatePhotoRegion(bounds);
  if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new RangeError("Invalid photo dimensions");
  }
  // Show the actual square input, including context, not an invisible center crop.
  const side = Math.min(Math.min(width, height), Math.max(width * bounds.width, height * bounds.height));
  const w = side / width;
  const h = side / height;
  const point = anchor || { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  if (![point.x, point.y].every(Number.isFinite) || point.x < bounds.x || point.y < bounds.y
    || point.x > bounds.x + bounds.width || point.y > bounds.y + bounds.height) {
    throw new RangeError("Invalid cloud area anchor");
  }
  // Keep the whole proposed area when it fits. If it doesn't, retain the mask
  // anchor and choose the square with maximum overlap along that axis.
  function origin(start, length, span, focus) {
    const far = start + length - span;
    const low = Math.max(0, focus - span, Math.min(start, far));
    const high = Math.min(1 - span, focus, Math.max(start, far));
    return Math.max(0, Math.min(1 - span, Math.max(low, Math.min(high, focus - span / 2))));
  }
  return { x: origin(bounds.x, bounds.width, w, point.x),
    y: origin(bounds.y, bounds.height, h, point.y), width: w, height: h };
}

export function movePhotoRegion(bounds, dx, dy) {
  validatePhotoRegion(bounds);
  if (![dx, dy].every(Number.isFinite)) throw new RangeError("Invalid photo selection movement");
  return { ...bounds, x: Math.max(0, Math.min(1 - bounds.width, bounds.x + dx)),
    y: Math.max(0, Math.min(1 - bounds.height, bounds.y + dy)) };
}

export function resizePhotoCorner(bounds, width, height, dx, dy) {
  validatePhotoRegion(bounds);
  if (![width, height, dx, dy].every(Number.isFinite) || width <= 0 || height <= 0)
    throw new RangeError("Invalid corner displacement");
  const side = bounds.width * width;
  const limit = Math.min((1 - bounds.x) * width, (1 - bounds.y) * height);
  const minimum = Math.min(side, .15 * Math.min(width, height));
  const next = Math.min(limit, Math.max(minimum, side + (dx * width + dy * height) / 2));
  return { ...bounds, width: next / width, height: next / height };
}

// Reject only near-black samples, not dark cloud bases, gray layers or blue sky.
export function isNearBlackCrop(rgba) {
  if (!rgba.length || rgba.length % 4 !== 0) return false;
  for (let i = 0; i < rgba.length; i += 4) {
    if (Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) > 12) return false;
  }
  return true;
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
  if (Math.abs(width - height) > 1e-6) throw new RangeError("Recognition requires a visible square selection");
  const scale = Math.min(1, 1600 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = canvas.width;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Nie udało się przygotować fragmentu.");
  context.drawImage(image, image.naturalWidth * bounds.x, image.naturalHeight * bounds.y,
    width, height, 0, 0, canvas.width, canvas.height);
  const sample = document.createElement("canvas");
  sample.width = sample.height = 16;
  const sampler = sample.getContext("2d", { willReadFrequently: true });
  if (sampler) {
    sampler.drawImage(canvas, 0, 0, 16, 16);
    if (isNearBlackCrop(sampler.getImageData(0, 0, 16, 16).data)) return { quality: "near-black" };
  }
  const previewUrl = canvas.toDataURL("image/jpeg", .9);
  return { previewUrl, base64: previewUrl.split(",")[1], selectedRegion: true };
}
