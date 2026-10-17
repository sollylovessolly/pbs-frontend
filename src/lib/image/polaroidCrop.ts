// The photo opening occupies 58% × 42% of the 1080 × 1920 frame.
export const POLAROID_ASPECT = (1080 * 0.58) / (1920 * 0.42);

export function polaroidCrop(
  width: number,
  height: number,
  rotation: number,
  zoom: number,
  position: { x: number; y: number },
  aspect = POLAROID_ASPECT,
) {
  const sideways = rotation % 180 !== 0;
  const rotatedWidth = sideways ? height : width;
  const rotatedHeight = sideways ? width : height;
  const scale =
    Math.max(aspect / rotatedWidth, 1 / rotatedHeight) * Math.max(1, zoom);
  const limitX = ((rotatedWidth * scale) / aspect - 1) / 2;
  const limitY = (rotatedHeight * scale - 1) / 2;
  const x = Math.max(-limitX, Math.min(limitX, position.x));
  const y = Math.max(-limitY, Math.min(limitY, position.y));
  return {
    position: { x, y },
    imageWidth: ((width * scale) / aspect) * 100,
    imageHeight: height * scale * 100,
    pixels: {
      x: (rotatedWidth - aspect / scale) / 2 - (x * aspect) / scale,
      y: (rotatedHeight - 1 / scale) / 2 - y / scale,
      width: aspect / scale,
      height: 1 / scale,
    },
  };
}
