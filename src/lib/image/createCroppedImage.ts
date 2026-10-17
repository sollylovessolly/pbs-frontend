import type { Area } from "react-easy-crop";

const getRadians = (degrees: number) => {
  return (degrees * Math.PI) / 180;
};

const getRotatedSize = (width: number, height: number, rotation: number) => {
  const radians = getRadians(rotation);

  return {
    width:
      Math.abs(Math.cos(radians) * width) +
      Math.abs(Math.sin(radians) * height),
    height:
      Math.abs(Math.sin(radians) * width) +
      Math.abs(Math.cos(radians) * height),
  };
};

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
};

export const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
) => {
  const image = await loadImage(imageSrc);

  const rotatedSize = getRotatedSize(
    image.naturalWidth,
    image.naturalHeight,
    rotation,
  );

  const rotationCanvas = document.createElement("canvas");
  const rotationContext = rotationCanvas.getContext("2d");

  if (!rotationContext) {
    throw new Error("Canvas is not supported.");
  }

  rotationCanvas.width = Math.round(rotatedSize.width);
  rotationCanvas.height = Math.round(rotatedSize.height);

  rotationContext.translate(
    rotationCanvas.width / 2,
    rotationCanvas.height / 2,
  );

  rotationContext.rotate(getRadians(rotation));

  rotationContext.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);

  rotationContext.drawImage(image, 0, 0);

  const outputCanvas = document.createElement("canvas");
  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    throw new Error("Canvas is not supported.");
  }

  outputCanvas.width = pixelCrop.width;
  outputCanvas.height = pixelCrop.height;

  outputContext.drawImage(
    rotationCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return outputCanvas.toDataURL("image/jpeg", 0.9);
};
