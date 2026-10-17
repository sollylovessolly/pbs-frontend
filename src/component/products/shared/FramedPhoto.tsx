"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { polaroidCrop } from "@/lib/image/polaroidCrop";

type Props = {
  src: string;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  aspect: number;
  editable?: boolean;
  onChange?: (updates: {
    crop: { x: number; y: number };
    croppedAreaPixels: Area;
  }) => void;
};
export default function FramedPhoto({
  src,
  crop,
  zoom,
  rotation,
  aspect,
  editable = false,
  onChange,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const drag = useRef<{
    x: number;
    y: number;
    crop: { x: number; y: number };
  } | null>(null);
  const geometry = size.width
    ? polaroidCrop(size.width, size.height, rotation, zoom, crop, aspect)
    : null;
  return (
    <div
      className="absolute inset-0"
      style={{
        touchAction: editable ? "none" : "auto",
        cursor: editable ? "grab" : "default",
      }}
      onPointerDown={(event) => {
        if (!editable || !geometry) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          x: event.clientX,
          y: event.clientY,
          crop: geometry.position,
        };
      }}
      onPointerMove={(event) => {
        if (!drag.current || !editable) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const next = polaroidCrop(
          size.width,
          size.height,
          rotation,
          zoom,
          {
            x:
              drag.current.crop.x +
              (event.clientX - drag.current.x) / bounds.width,
            y:
              drag.current.crop.y +
              (event.clientY - drag.current.y) / bounds.height,
          },
          aspect,
        );
        onChange?.({ crop: next.position, croppedAreaPixels: next.pixels });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
    >
      <img
        src={src}
        alt="Your cropped photo"
        draggable={false}
        onLoad={(event) =>
          setSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }
        style={{
          position: "absolute",
          maxWidth: "none",
          width: geometry ? `${geometry.imageWidth}%` : "100%",
          height: geometry ? `${geometry.imageHeight}%` : "100%",
          left: `${50 + (geometry?.position.x ?? 0) * 100}%`,
          top: `${50 + (geometry?.position.y ?? 0) * 100}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          visibility: geometry ? "visible" : "hidden",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
