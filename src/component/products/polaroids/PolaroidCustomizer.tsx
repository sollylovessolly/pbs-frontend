"use client";

/* eslint-disable @next/next/no-img-element */

import { type Area } from "react-easy-crop";
import { polaroidCrop } from "@/lib/image/polaroidCrop";
import { usePhotoDraft } from "@/hooks/usePhotoDraft";
import DraftNotice from "@/component/products/shared/DraftNotice";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowLeft,
  LuCheck,
  LuImagePlus,
  LuPencil,
  LuTrash2,
  LuX,
} from "react-icons/lu";

import { useProduct } from "@/component/products/shared/ProductProvider";
import {
  prepareInBatches,
  uploadAsset,
  polaroidPng,
  cartThumbnail,
} from "@/lib/commerce/production";
import { useCart } from "@/context/CartContext";
import { createCroppedImage } from "@/lib/image/createCroppedImage";

const ROTATION_OPTIONS = [0, 90, 180, 270] as const;

/**
 * Position of the photo opening inside:
 * /public/images/polaroid-frame.svg
 *
 * Adjust these percentages slightly if your specific SVG
 * opening sits differently.
 */
const PHOTO_WINDOW = {
  left: "20%",
  top: "31%",
  width: "58%",
  height: "42%",
};

type CropPosition = {
  x: number;
  y: number;
};

type UploadedPhoto = {
  id: string;
  name: string;
  src: string;
  crop: CropPosition;
  zoom: number;
  rotation: number;
  quantity: number;
  croppedAreaPixels: Area | null;
};

type PolaroidCustomizerProps = {
  editItemId?: string | null;
};

type PolaroidFramePreviewProps = {
  photo: UploadedPhoto;
  editable?: boolean;
  onChange?: (updates: Partial<UploadedPhoto>) => void;
  className?: string;
};

const PolaroidFramePreview = ({
  photo,
  editable = false,
  onChange,
  className = "",
}: PolaroidFramePreviewProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const drag = useRef<{ x: number; y: number; crop: CropPosition } | null>(
    null,
  );
  const geometry = size.width
    ? polaroidCrop(
        size.width,
        size.height,
        photo.rotation,
        photo.zoom,
        photo.crop,
      )
    : null;
  return (
    <div className={["relative w-full", className].filter(Boolean).join(" ")}>
      {/* Keeps the exact aspect ratio of the real frame */}
      <img
        src="/images/polaroid-frame.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="invisible block h-auto w-full select-none"
      />

      {/* Customer photo inside the frame opening */}
      <div
        className="absolute z-0 overflow-hidden bg-beige"
        style={PHOTO_WINDOW}
      >
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
              photo.rotation,
              photo.zoom,
              {
                x:
                  drag.current.crop.x +
                  (event.clientX - drag.current.x) / bounds.width,
                y:
                  drag.current.crop.y +
                  (event.clientY - drag.current.y) / bounds.height,
              },
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
            src={photo.src}
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
              transform: `translate(-50%, -50%) rotate(${photo.rotation}deg)`,
              visibility: geometry ? "visible" : "hidden",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Real SVG frame above the photo */}
      <img
        src="/images/polaroid-frame.svg"
        alt="Polaroid print preview"
        draggable={false}
        className="pointer-events-none absolute inset-0 z-10 block h-full w-full select-none"
      />
    </div>
  );
};

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error("The uploaded image could not be loaded."));
    };

    image.src = src;
  });
};

const PolaroidCustomizer = ({ editItemId = null }: PolaroidCustomizerProps) => {
  const router = useRouter();
  const submissionLock = useRef(false);
  const { variant } = useProduct();
  const BASE_PRICE = Number(variant.sellingPrice);

  const { items, isReady, addItems, updateItem } = useCart();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const objectUrlsRef = useRef<Set<string>>(new Set());

  const loadedEditItemIdRef = useRef<string | null>(null);

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const draft = usePhotoDraft(
    `polaroids:${variant.sku}`,
    photos,
    setPhotos,
    objectUrlsRef,
    !editItemId,
  );

  const editingCartItem = useMemo(() => {
    if (!editItemId) return null;

    return items.find((item) => item.id === editItemId) ?? null;
  }, [editItemId, items]);

  const activePhoto = useMemo(() => {
    return photos.find((photo) => photo.id === activePhotoId) ?? null;
  }, [photos, activePhotoId]);

  const activePhotoIndex = useMemo(() => {
    if (!activePhotoId) return -1;

    return photos.findIndex((photo) => photo.id === activePhotoId);
  }, [photos, activePhotoId]);

  const totalPrints = useMemo(() => {
    return photos.reduce((total, photo) => total + photo.quantity, 0);
  }, [photos]);

  const totalPrice = totalPrints * BASE_PRICE;

  const updatePhoto = (photoId: string, updates: Partial<UploadedPhoto>) => {
    setPhotos((currentPhotos) =>
      currentPhotos.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              ...updates,
            }
          : photo,
      ),
    );
  };

  const openEditor = (photoId: string) => {
    setActivePhotoId(photoId);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    const validFiles = selectedFiles
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, editItemId ? 1 : undefined);

    if (!validFiles.length) {
      event.target.value = "";
      return;
    }

    const newPhotos: UploadedPhoto[] = validFiles.map((file) => {
      const objectUrl = URL.createObjectURL(file);

      objectUrlsRef.current.add(objectUrl);

      return {
        id: crypto.randomUUID(),
        name: file.name,
        src: objectUrl,
        crop: {
          x: 0,
          y: 0,
        },
        zoom: 1,
        rotation: 0,
        quantity: editItemId && photos[0] ? photos[0].quantity : 1,
        croppedAreaPixels: null,
      };
    });

    if (editItemId) {
      photos.forEach((photo) => {
        if (objectUrlsRef.current.has(photo.src)) {
          URL.revokeObjectURL(photo.src);

          objectUrlsRef.current.delete(photo.src);
        }
      });

      setPhotos(newPhotos);
    } else {
      setPhotos((currentPhotos) => [...currentPhotos, ...newPhotos]);
    }

    setActivePhotoId(newPhotos[0]?.id ?? null);

    event.target.value = "";
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = photos.find((photo) => photo.id === photoId);

    if (photoToRemove && objectUrlsRef.current.has(photoToRemove.src)) {
      URL.revokeObjectURL(photoToRemove.src);

      objectUrlsRef.current.delete(photoToRemove.src);
    }

    setPhotos((currentPhotos) =>
      currentPhotos.filter((photo) => photo.id !== photoId),
    );

    if (activePhotoId === photoId) {
      setActivePhotoId(null);
      setEditorOpen(false);
    }
  };

  const changeQuantity = (photoId: string, difference: number) => {
    const selectedPhoto = photos.find((photo) => photo.id === photoId);

    if (!selectedPhoto) return;

    updatePhoto(photoId, {
      quantity: Math.max(
        1,
        Math.min(
          selectedPhoto.quantity + difference,
          variant.availableQuantity == null
            ? Infinity
            : variant.availableQuantity -
                photos
                  .filter((p) => p.id !== photoId)
                  .reduce((sum, p) => sum + p.quantity, 0),
        ),
      ),
    });
  };

  const prepareCartItem = async (photo: UploadedPhoto, index: number) => {
    const source = await loadImage(photo.src);
    const cropPixels = polaroidCrop(
      source.naturalWidth,
      source.naturalHeight,
      photo.rotation,
      photo.zoom,
      photo.crop,
    ).pixels;

    const previewUrl = await createCroppedImage(
      photo.src,
      cropPixels,
      photo.rotation,
    );

    const finalPngUrl = await uploadAsset(
      await polaroidPng(previewUrl),
      "POLAROID_FINAL",
    );
    const framedPreview = await polaroidPng(previewUrl, true);
    const uploadedPreview = await uploadAsset(
      framedPreview,
      "POLAROID_PREVIEW",
    );

    return {
      productType: "polaroid" as const,

      name: editingCartItem?.name ?? `Polaroid Print ${index + 1}`,

      unitPrice: BASE_PRICE,
      variantSku: variant.sku,
      availableQuantity: variant.availableQuantity,
      quantity: photo.quantity,

      previewUrl: await cartThumbnail(framedPreview),
      customization: { finalPngUrl, previewUrl: uploadedPreview },

      crop: photo.crop,
      croppedAreaPixels: cropPixels,
      zoom: photo.zoom,
      rotation: photo.rotation,

      turnaround: "Ready in 24hrs",

      editHref: "/products/polaroids",

      isFast: true,
    };
  };

  const handleAddToCart = async () => {
    if (photos.length === 0 || isAddingToCart) {
      return;
    }

    if (submissionLock.current) return;
    submissionLock.current = true;
    setIsAddingToCart(true);
    setSubmitError("");

    try {
      if (editItemId) {
        const updatedItem = await prepareCartItem(photos[0], 0);

        updateItem(editItemId, updatedItem);

        router.push("/cart");
        return;
      }

      const cartItems = await prepareInBatches(photos, prepareCartItem);

      addItems(cartItems);
      await draft.finish();

      router.push("/cart");
    } catch (error) {
      console.error("Could not prepare Polaroid prints:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not prepare your photos. Please retry.",
      );
    } finally {
      submissionLock.current = false;
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    if (!editItemId || !isReady || loadedEditItemIdRef.current === editItemId) {
      return;
    }

    if (!editingCartItem || !editingCartItem.sourceImageUrl) {
      router.replace("/cart");
      return;
    }

    const localPhotoId = crypto.randomUUID();

    queueMicrotask(() => {
      setPhotos([
        {
          id: localPhotoId,

          name: editingCartItem.name,

          src: editingCartItem.sourceImageUrl ?? editingCartItem.previewUrl,

          crop: editingCartItem.crop ?? {
            x: 0,
            y: 0,
          },

          zoom: editingCartItem.zoom ?? 1,

          rotation: editingCartItem.rotation ?? 0,

          quantity: editingCartItem.quantity,

          croppedAreaPixels: editingCartItem.croppedAreaPixels ?? null,
        },
      ]);

      setActivePhotoId(localPhotoId);

      loadedEditItemIdRef.current = editItemId;
    });
  }, [editItemId, editingCartItem, isReady, router]);

  useEffect(() => {
    if (!editorOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEditor();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editorOpen]);

  useEffect(() => {
    const urls = objectUrlsRef.current;

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      urls.clear();
    };
  }, []);

  if (!draft.ready)
    return (
      <p role="status" className="p-8 text-center">
        Getting your design ready…
      </p>
    );
  return (
    <>
      {photos.length > 0 && !editItemId && (
        <DraftNotice notice={draft.notice} onDiscard={draft.discard} />
      )}
      {submitError && (
        <p
          role="alert"
          className="mx-auto my-4 max-w-[1240px] rounded-xl border border-burgundy px-5 py-3 text-sm"
        >
          {submitError}
        </p>
      )}
      <section className="px-4 pb-28 pt-6 sm:px-5 md:px-7 md:pt-10 lg:pb-16 lg:pt-14">
        <div className="mx-auto max-w-[1240px]">
          {photos.length === 0 ? (
            <div className="mx-auto max-w-[720px] rounded-[20px] border-2 border-ink bg-paper p-5 text-center shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-10">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-blush sm:h-14 sm:w-14">
                <LuImagePlus className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>

              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                Create your Polaroids
              </h2>

              <p className="mx-auto mt-2 max-w-[500px] text-sm leading-6 text-ink/60 sm:text-base">
                Upload the photos you want to print. Each photo starts as one
                copy, and you can adjust the quantity afterwards.
              </p>

              <button
                type="button"
                disabled={isAddingToCart}
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto mt-6 flex items-center justify-center rounded-full border-2 border-ink bg-burgundy px-6 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LuImagePlus className="mr-2 h-5 w-5" />
                Choose photos
              </button>

              <p className="mt-4 text-xs font-semibold text-ink/50">
                {formatPrice(BASE_PRICE)} per print
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C] sm:text-base">
                    your memories
                  </span>

                  <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                    Your Polaroids
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-ink/60 sm:text-sm sm:leading-6">
                    Edit the crop only when needed, then choose how many copies
                    you want.
                  </p>
                </div>

                {!editItemId && (
                  <button
                    type="button"
                    disabled={isAddingToCart}
                    onClick={() => fileInputRef.current?.click()}
                    className="hidden shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#2A211C] sm:flex"
                  >
                    <LuImagePlus className="mr-2 h-4 w-4" />
                    Add photos
                  </button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo, index) => (
                  <article
                    key={photo.id}
                    className="flex min-w-0 flex-col rounded-[14px] border-2 border-ink bg-paper p-2.5 shadow-[0_4px_0_rgba(42,33,28,0.1)] sm:rounded-[18px] sm:p-4"
                  >
                    <div className="flex min-h-[190px] items-center justify-center overflow-hidden rounded-[10px] bg-blush/50 p-2 sm:min-h-[280px] sm:p-4">
                      <PolaroidFramePreview
                        photo={photo}
                        className="max-w-[165px] drop-shadow-[4px_5px_0_rgba(42,33,28,0.12)] sm:max-w-[230px]"
                      />
                    </div>

                    <div className="flex flex-1 flex-col pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-bold text-ink sm:text-sm">
                            Photo {index + 1}
                          </h3>

                          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-burgundy sm:text-[10px]">
                            <LuCheck className="h-3 w-3" />
                            Ready to print
                          </span>
                        </div>

                        {!editItemId && (
                          <button
                            type="button"
                            aria-label={`Remove photo ${index + 1}`}
                            disabled={isAddingToCart}
                            onClick={() => removePhoto(photo.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink/40 transition hover:bg-burgundy hover:text-cream sm:h-8 sm:w-8"
                          >
                            <LuTrash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isAddingToCart}
                        onClick={() => openEditor(photo.id)}
                        className="mt-3 flex w-full items-center justify-center rounded-full border-2 border-ink bg-cream px-2 py-2 text-[10px] font-bold transition hover:bg-beige sm:text-xs"
                      >
                        <LuPencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit crop
                      </button>

                      <div className="mt-3 border-t border-dashed border-ink/20 pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-ink/55 sm:text-xs">
                            Copies
                          </span>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease quantity for photo ${
                                index + 1
                              }`}
                              disabled={photo.quantity <= 1 || isAddingToCart}
                              onClick={() => changeQuantity(photo.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold disabled:opacity-40 sm:h-8 sm:w-8"
                            >
                              −
                            </button>

                            <span className="min-w-4 text-center font-serif text-sm font-bold sm:text-base">
                              {photo.quantity}
                            </span>

                            <button
                              type="button"
                              aria-label={`Increase quantity for photo ${
                                index + 1
                              }`}
                              disabled={isAddingToCart}
                              onClick={() => changeQuantity(photo.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold sm:h-8 sm:w-8"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 text-right text-[11px] font-bold text-burgundy sm:text-sm">
                          {formatPrice(photo.quantity * BASE_PRICE)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}

                {!editItemId && (
                  <button
                    type="button"
                    disabled={isAddingToCart}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-ink bg-beige/40 p-4 text-center transition hover:bg-beige disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[360px] sm:rounded-[18px]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper sm:h-12 sm:w-12">
                      <LuImagePlus className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>

                    <span className="mt-3 text-xs font-bold text-ink sm:text-sm">
                      Add more photos
                    </span>

                    <span className="mt-1 text-[10px] text-ink/50 sm:text-xs">
                      JPG, PNG or WebP
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-8 rounded-[16px] border-2 border-ink bg-beige p-4 sm:mt-10 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-ink/55 sm:text-sm">
                      {photos.length} {photos.length === 1 ? "photo" : "photos"}{" "}
                      · {totalPrints} total{" "}
                      {totalPrints === 1 ? "print" : "prints"}
                    </p>

                    <p className="mt-1 font-serif text-2xl font-bold text-burgundy sm:text-3xl">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>

                  <p className="text-right text-[10px] leading-4 text-ink/55 sm:text-xs sm:leading-5">
                    {totalPrints} × {formatPrice(BASE_PRICE)}
                    <br />
                    Ready in 24hrs
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-busy={isAddingToCart}
                disabled={photos.length === 0 || isAddingToCart}
                onClick={handleAddToCart}
                className="mx-auto mt-6 hidden w-full max-w-[560px] items-center justify-center rounded-full border-2 border-ink bg-burgundy px-6 py-4 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
              >
                {isAddingToCart
                  ? editItemId
                    ? "Saving Changes…"
                    : "Preparing Your Prints…"
                  : editItemId
                    ? `Save Changes — ${formatPrice(totalPrice)}`
                    : `Add ${totalPrints} ${
                        totalPrints === 1 ? "Print" : "Prints"
                      } to Cart — ${formatPrice(totalPrice)}`}
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple={!editItemId}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      {photos.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-cream px-4 py-3 lg:hidden">
          <div className="shrink-0">
            <p className="text-[10px] font-semibold text-ink/55">
              {totalPrints} {totalPrints === 1 ? "print" : "prints"}
            </p>

            <p className="font-serif text-base font-bold text-burgundy">
              {formatPrice(totalPrice)}
            </p>
          </div>

          <button
            type="button"
            aria-busy={isAddingToCart}
            disabled={isAddingToCart}
            onClick={handleAddToCart}
            className="flex flex-1 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAddingToCart
              ? editItemId
                ? "Saving…"
                : "Preparing…"
              : editItemId
                ? "Save Changes"
                : "Add to Cart"}
          </button>
        </div>
      )}

      {editorOpen && activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Edit photo ${activePhotoIndex + 1}`}
          className="fixed inset-0 z-[90] flex flex-col bg-cream lg:items-center lg:justify-center lg:bg-ink/50 lg:p-6"
        >
          <button
            type="button"
            aria-label="Close photo editor"
            onClick={closeEditor}
            className="absolute inset-0 hidden lg:block"
          />

          <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-cream lg:h-auto lg:max-h-[92vh] lg:max-w-[980px] lg:rounded-[22px] lg:border-2 lg:border-ink lg:shadow-[10px_10px_0_#2A211C]">
            <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={closeEditor}
                className="flex items-center gap-2 text-sm font-bold text-ink"
              >
                <LuArrowLeft className="h-5 w-5 lg:hidden" />
                <LuX className="hidden h-5 w-5 lg:block" />
                Back
              </button>

              <p className="text-xs font-bold text-ink/55 sm:text-sm">
                Photo {activePhotoIndex + 1} of {photos.length}
              </p>

              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full bg-burgundy px-3 py-2 text-xs font-bold text-cream sm:px-4"
              >
                Done
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:overflow-hidden">
              <div className="flex min-h-[390px] items-center justify-center bg-blush p-4 sm:min-h-[520px] sm:p-8 lg:min-h-[620px]">
                <PolaroidFramePreview
                  key={activePhoto.id}
                  photo={activePhoto}
                  editable
                  onChange={(updates) => updatePhoto(activePhoto.id, updates)}
                  className="max-w-[270px] drop-shadow-[7px_9px_0_rgba(42,33,28,0.16)] sm:max-w-[350px]"
                />
              </div>

              <div className="bg-paper p-5 sm:p-7 lg:overflow-y-auto lg:p-8">
                <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
                  editing photo {activePhotoIndex + 1}
                </span>

                <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                  Adjust your photo
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Drag the photo inside the frame, then adjust the zoom or
                  orientation.
                </p>

                <div className="mt-7">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <label htmlFor="polaroid-editor-zoom">Zoom</label>

                    <span className="text-ink/50">
                      {Math.round(activePhoto.zoom * 100)}%
                    </span>
                  </div>

                  <input
                    id="polaroid-editor-zoom"
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={activePhoto.zoom}
                    onChange={(event) =>
                      updatePhoto(activePhoto.id, {
                        zoom: Number(event.target.value),
                      })
                    }
                    className="mt-4 w-full accent-burgundy"
                  />
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <p>Rotate photo</p>

                    <span className="text-ink/50">{activePhoto.rotation}°</span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {ROTATION_OPTIONS.map((rotation) => {
                      const isSelected = activePhoto.rotation === rotation;

                      return (
                        <button
                          key={rotation}
                          type="button"
                          onClick={() =>
                            updatePhoto(activePhoto.id, {
                              rotation,
                              zoom: 1,

                              crop: {
                                x: 0,
                                y: 0,
                              },

                              croppedAreaPixels: null,
                            })
                          }
                          className={[
                            "rounded-xl border-2 border-ink px-2 py-2.5 text-xs font-bold",

                            isSelected
                              ? "bg-burgundy text-cream shadow-[2px_2px_0_#2A211C]"
                              : "bg-cream hover:bg-beige",
                          ].join(" ")}
                        >
                          {rotation}°
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  className="mt-8 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
                >
                  <LuCheck className="mr-2 h-5 w-5" />
                  Done editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PolaroidCustomizer;
