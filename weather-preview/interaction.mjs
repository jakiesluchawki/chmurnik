export const HEIGHT_RANGE = { min: 0, max: 3000, step: 10 };
export const HEIGHT_SPAN = 0.48;

export function dragHeight(startHeight, startY, currentY, sceneHeight) {
  if (
    ![startHeight, startY, currentY, sceneHeight].every(Number.isFinite) ||
    sceneHeight <= 0
  )
    return startHeight;
  const height =
    startHeight +
    ((startY - currentY) / (sceneHeight * HEIGHT_SPAN)) * HEIGHT_RANGE.max;
  return Math.max(
    HEIGHT_RANGE.min,
    Math.min(
      HEIGHT_RANGE.max,
      Math.round(height / HEIGHT_RANGE.step) * HEIGHT_RANGE.step,
    ),
  );
}

export function keyboardHeight(value, key) {
  const delta = {
    ArrowUp: 50,
    ArrowRight: 50,
    ArrowDown: -50,
    ArrowLeft: -50,
    PageUp: 500,
    PageDown: -500,
  };
  if (key === "Home") return HEIGHT_RANGE.min;
  if (key === "End") return HEIGHT_RANGE.max;
  if (!Object.hasOwn(delta, key)) return null;
  return Math.max(
    HEIGHT_RANGE.min,
    Math.min(HEIGHT_RANGE.max, value + delta[key]),
  );
}
