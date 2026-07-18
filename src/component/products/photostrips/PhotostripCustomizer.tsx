"use client";

/* eslint-disable @next/next/no-img-element */

import Cropper, { type Area } from "react-easy-crop";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LuArrowLeft,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuImagePlus,
  LuImages,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuX,
} from "react-icons/lu";

import { useCart } from "@/context/CartContext";
import { createCroppedImage } from "@/lib/image/createCroppedImage";
import type { NewCartItem } from "@/types/cart";

const BASE_PRICE = 4000;
const INITIAL_TEMPLATE_COUNT = 6;
const ROTATION_OPTIONS = [0, 90, 180, 270] as const;

type CropPosition = {
  x: number;
  y: number;
};

type SlotGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PhotostripTemplate = {
  id: string;
  name: string;
  description: string;
  src: string;

  sourceWidth: number;
  sourceHeight: number;

  outputWidth: number;
  outputHeight: number;

  sizeLabel: string;
  format: "strip" | "collage";

  slots: SlotGeometry[];
};
type UploadedPhoto = {
  name: string;
  src: string;
};

type SlotState = {
  id: string;
  geometry: SlotGeometry;
  photo: UploadedPhoto | null;
  crop: CropPosition;
  zoom: number;
  rotation: number;
  croppedAreaPixels: Area | null;
};

type PhotostripConfiguration = {
  id: string;
  templateId: string;
  slots: SlotState[];
  quantity: number;
};

type UploadTarget = {
  configurationId: string;
  slotIndex: number;
};

type PhotostripPreviewProps = {
  template: PhotostripTemplate;
  slots: SlotState[];
  editableSlotIndex?: number | null;
  onSlotChange?: (
    slotIndex: number,
    updates: Partial<SlotState>,
  ) => void;
  className?: string;
};

const PHOTOSTRIP_TEMPLATES: PhotostripTemplate[] = [
  {
    id: "memories-noir",
    name: "Memories Noir",
    description: "Three photos with a dark vintage finish",
    src: "/images/templates/memories-noir.png",
    sourceWidth: 707,
    sourceHeight: 2000,
    outputWidth: 600,
    outputHeight: 1800,
    sizeLabel: "2 × 6 inches",
    format: "strip",
    slots: [
      {
        x: 59,
        y: 90,
        width: 589,
        height: 430,
      },
      {
        x: 59,
        y: 712,
        width: 589,
        height: 463,
      },
      {
        x: 59,
        y: 1392,
        width: 589,
        height: 466,
      },
    ],
  },
  {
    id: "classic-black",
    name: "Classic Black",
    description: "A clean three-photo cinema-style strip",
    src: "/images/templates/classic-black.svg",
    sourceWidth: 297.75,
    sourceHeight: 842.25,
    outputWidth: 600,
    outputHeight: 1800,
    sizeLabel: "2 × 6 inches",
    format: "strip",
    slots: [
      {
        x: 14.88,
        y: 15,
        width: 267.6,
        height: 252.74,
      },
      {
        x: 14.88,
        y: 294.34,
        width: 267.6,
        height: 252.66,
      },
      {
        x: 14.88,
        y: 574,
        width: 267.6,
        height: 252.5,
      },
    ],
  },
  {
    id: "moments-blue",
    name: "Blue Moments",
    description: "A bold four-photo strip with electric-blue details",
    src: "/images/templates/moments-blue.svg",
    sourceWidth: 144,
    sourceHeight: 432,
    outputWidth: 600,
    outputHeight: 1800,
    sizeLabel: "2 × 6 inches",
    format: "strip",
    slots: [
      {
        x: 17.13,
        y: 41.75,
        width: 113.55,
        height: 66.65,
      },
      {
        x: 17.13,
        y: 116.97,
        width: 113.55,
        height: 66.66,
      },
      {
        x: 17.13,
        y: 192.2,
        width: 113.55,
        height: 66.65,
      },
      {
        x: 17.13,
        y: 267.43,
        width: 113.55,
        height: 66.65,
      },
    ],
  },
  {
    id: "vintage-ticket",
    name: "Vintage Ticket",
    description: "A nostalgic three-photo cinema-ticket design",
    src: "/images/templates/vintage-ticket.svg",
    sourceWidth: 144,
    sourceHeight: 431.999984,
    outputWidth: 600,
    outputHeight: 1800,
    sizeLabel: "2 × 6 inches",
    format: "strip",
    slots: [
      {
        x: 10.808594,
        y: 83.632812,
        width: 119.050781,
        height: 86.484376,
      },
      {
        x: 10.808594,
        y: 172.785156,
        width: 119.050781,
        height: 93.234375,
      },
      {
        x: 10.808594,
        y: 268.6875,
        width: 119.050781,
        height: 93.039062,
      },
    ],
  },
  {
    id: "looking-good",
    name: "Looking Good",
    description: "A playful four-photo collage with a handwritten finish",
    src: "/images/templates/looking-good-4x6.svg",
    sourceWidth: 567,
    sourceHeight: 850.499975,
    outputWidth: 1200,
    outputHeight: 1800,
    sizeLabel: "4 × 6 inches",
    format: "collage",
    slots: [
      {
        x: 18.71875,
        y: 36.410156,
        width: 253,
        height: 308.050782,
      },
      {
        x: 296.964844,
        y: 40.128906,
        width: 253,
        height: 308.050782,
      },
      {
        x: 18.71875,
        y: 356.425781,
        width: 253,
        height: 308.050782,
      },
      {
        x: 296.964844,
        y: 356.425781,
        width: 253,
        height: 308.050782,
      },
    ],
  },
];

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const createSlotState = (
  geometry: SlotGeometry,
): SlotState => {
  return {
    id: crypto.randomUUID(),
    geometry,
    photo: null,
    crop: {
      x: 0,
      y: 0,
    },
    zoom: 1,
    rotation: 0,
    croppedAreaPixels: null,
  };
};

const createConfiguration = (
  template: PhotostripTemplate,
): PhotostripConfiguration => {
  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    slots: template.slots.map(createSlotState),
    quantity: 1,
  };
};

const isConfigurationComplete = (
  configuration: PhotostripConfiguration,
) => {
  return (
    configuration.slots.length > 0 &&
    configuration.slots.every((slot) => Boolean(slot.photo))
  );
};

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error(`The image could not be loaded: ${src}`));
    };

    image.src = src;
  });
};

const getDefaultCrop = async (
  imageSrc: string,
  rotation: number,
  targetAspect: number,
): Promise<Area> => {
  const image = await loadImage(imageSrc);
  const isSideways = rotation === 90 || rotation === 270;

  const rotatedWidth = isSideways
    ? image.naturalHeight
    : image.naturalWidth;

  const rotatedHeight = isSideways
    ? image.naturalWidth
    : image.naturalHeight;

  const imageAspect = rotatedWidth / rotatedHeight;

  let cropWidth = rotatedWidth;
  let cropHeight = rotatedHeight;

  if (imageAspect > targetAspect) {
    cropWidth = rotatedHeight * targetAspect;
  } else {
    cropHeight = rotatedWidth / targetAspect;
  }

  return {
    x: Math.round((rotatedWidth - cropWidth) / 2),
    y: Math.round((rotatedHeight - cropHeight) / 2),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
};

const getSlotStyle = (
  geometry: SlotGeometry,
  template: PhotostripTemplate,
) => {
  return {
    left: `${(geometry.x / template.sourceWidth) * 100}%`,
    top: `${(geometry.y / template.sourceHeight) * 100}%`,
    width: `${(geometry.width / template.sourceWidth) * 100}%`,
    height: `${(geometry.height / template.sourceHeight) * 100}%`,
  };
};

const TemplateArtwork = ({
  template,
  className = "",
}: {
  template: PhotostripTemplate;
  className?: string;
}) => {
  const [hasError, setHasError] = useState(false);

  const aspectRatio = `${template.sourceWidth} / ${template.sourceHeight}`;

  if (hasError) {
    return (
      <div
        className={[
          "flex w-full flex-col items-center justify-center bg-ink px-2 text-center text-cream",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          aspectRatio,
        }}
      >
        <LuImages className="h-5 w-5 opacity-60" />

        <p className="mt-2 text-[8px] font-bold leading-3">
          Template file missing
        </p>

        <p className="mt-1 break-all text-[6px] leading-3 opacity-60">
          {template.src}
        </p>
      </div>
    );
  }

  return (
    <img
      src={template.src}
      alt={`${template.name} design`}
      draggable={false}
      onError={() => setHasError(true)}
      className={[
        "block h-auto w-full select-none object-fill",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        aspectRatio,
      }}
    />
  );
};

const PhotostripPreview = ({
  template,
  slots,
  editableSlotIndex = null,
  onSlotChange,
  className = "",
}: PhotostripPreviewProps) => {
  return (
    <div
      className={[
        "relative w-full overflow-hidden bg-ink shadow-[7px_9px_0_rgba(42,33,28,0.16)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        aspectRatio: `${template.sourceWidth} / ${template.sourceHeight}`,
      }}
    >
      <TemplateArtwork
        template={template}
        className="absolute inset-0 z-0 h-full w-full"
      />

      {slots.map((slot, slotIndex) => {
        if (!slot.photo) return null;

        const isEditable = editableSlotIndex === slotIndex;

        return (
          <div
            key={slot.id}
            className={[
              "absolute z-10 overflow-hidden bg-beige",
              isEditable
                ? "ring-2 ring-burgundy ring-offset-2 ring-offset-cream"
                : "",
            ].join(" ")}
            style={getSlotStyle(slot.geometry, template)}
          >
            <Cropper
              image={slot.photo.src}
              crop={slot.crop}
              zoom={slot.zoom}
              rotation={slot.rotation}
              aspect={slot.geometry.width / slot.geometry.height}
              objectFit="cover"
              cropShape="rect"
              showGrid={isEditable}
              restrictPosition
              onCropChange={(crop) => {
                if (!isEditable) return;

                onSlotChange?.(slotIndex, {
                  crop,
                });
              }}
              onZoomChange={(zoom) => {
                if (!isEditable) return;

                onSlotChange?.(slotIndex, {
                  zoom,
                });
              }}
              onCropComplete={(_, croppedAreaPixels) => {
                if (!isEditable) return;

                onSlotChange?.(slotIndex, {
                  croppedAreaPixels,
                });
              }}
              style={{
                containerStyle: {
                  position: "absolute",
                  inset: 0,
                  pointerEvents: isEditable ? "auto" : "none",
                },
                cropAreaStyle: {
                  border: isEditable
                    ? "2px solid rgba(255,255,255,0.95)"
                    : "none",
                  boxShadow: "none",
                },
                mediaStyle: {
                  pointerEvents: "none",
                },
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const PhotostripCustomizer = () => {
  const router = useRouter();
  const { addItems } = useCart();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const [configurations, setConfigurations] = useState<
    PhotostripConfiguration[]
  >([]);

  const [designPickerOpen, setDesignPickerOpen] = useState(false);
  const [showAllDesigns, setShowAllDesigns] = useState(false);
  const [activeConfigurationId, setActiveConfigurationId] = useState<
    string | null
  >(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(
    null,
  );
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(
    null,
  );
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const templateMap = useMemo(() => {
    return new Map(
      PHOTOSTRIP_TEMPLATES.map((template) => [template.id, template]),
    );
  }, []);

  const templateCounts = useMemo(() => {
    return configurations.reduce<Record<string, number>>(
      (counts, configuration) => {
        counts[configuration.templateId] =
          (counts[configuration.templateId] ?? 0) + 1;

        return counts;
      },
      {},
    );
  }, [configurations]);

  const activeConfiguration = useMemo(() => {
    return (
      configurations.find(
        (configuration) => configuration.id === activeConfigurationId,
      ) ?? null
    );
  }, [activeConfigurationId, configurations]);

  const activeTemplate = useMemo(() => {
    if (!activeConfiguration) return null;

    return templateMap.get(activeConfiguration.templateId) ?? null;
  }, [activeConfiguration, templateMap]);

  const activeSlot = useMemo(() => {
    if (!activeConfiguration || editingSlotIndex === null) return null;

    return activeConfiguration.slots[editingSlotIndex] ?? null;
  }, [activeConfiguration, editingSlotIndex]);

  const completedConfigurations = useMemo(() => {
    return configurations.filter(isConfigurationComplete).length;
  }, [configurations]);

  const allConfigurationsComplete =
    configurations.length > 0 &&
    completedConfigurations === configurations.length;

  const totalPrints = useMemo(() => {
    return configurations.reduce(
      (total, configuration) => total + configuration.quantity,
      0,
    );
  }, [configurations]);

  const totalPrice = totalPrints * BASE_PRICE;

  const orderSizeSummary = useMemo(() => {
    const selectedSizes = new Set(
      configurations
        .map((configuration) =>
          templateMap.get(configuration.templateId)?.sizeLabel,
        )
        .filter((sizeLabel): sizeLabel is string => Boolean(sizeLabel)),
    );

    if (selectedSizes.size === 0) {
      return "No size selected";
    }

    if (selectedSizes.size === 1) {
      return [...selectedSizes][0];
    }

    return "Mixed print sizes";
  }, [configurations, templateMap]);

  const visibleTemplates = showAllDesigns
    ? PHOTOSTRIP_TEMPLATES
    : PHOTOSTRIP_TEMPLATES.slice(0, INITIAL_TEMPLATE_COUNT);

  const revokePhoto = (photo: UploadedPhoto | null) => {
    if (photo?.src && objectUrlsRef.current.has(photo.src)) {
      URL.revokeObjectURL(photo.src);
      objectUrlsRef.current.delete(photo.src);
    }
  };

  const revokeConfigurationPhotos = (
    configuration: PhotostripConfiguration,
  ) => {
    configuration.slots.forEach((slot) => revokePhoto(slot.photo));
  };

  const updateConfiguration = (
    configurationId: string,
    updates: Partial<PhotostripConfiguration>,
  ) => {
    setConfigurations((currentConfigurations) =>
      currentConfigurations.map((configuration) =>
        configuration.id === configurationId
          ? {
              ...configuration,
              ...updates,
            }
          : configuration,
      ),
    );
  };

  const updateSlot = (
    configurationId: string,
    slotIndex: number,
    updates: Partial<SlotState>,
  ) => {
    setConfigurations((currentConfigurations) =>
      currentConfigurations.map((configuration) => {
        if (configuration.id !== configurationId) {
          return configuration;
        }

        return {
          ...configuration,
          slots: configuration.slots.map((slot, index) =>
            index === slotIndex
              ? {
                  ...slot,
                  ...updates,
                }
              : slot,
          ),
        };
      }),
    );
  };

  const increaseTemplateCount = (template: PhotostripTemplate) => {
    const newConfiguration = createConfiguration(template);

    setConfigurations((currentConfigurations) => [
      ...currentConfigurations,
      newConfiguration,
    ]);
  };

  const decreaseTemplateCount = (templateId: string) => {
    const matchingConfigurations = configurations.filter(
      (configuration) => configuration.templateId === templateId,
    );

    const configurationToRemove =
      matchingConfigurations[matchingConfigurations.length - 1];

    if (!configurationToRemove) return;

    revokeConfigurationPhotos(configurationToRemove);

    setConfigurations((currentConfigurations) =>
      currentConfigurations.filter(
        (configuration) => configuration.id !== configurationToRemove.id,
      ),
    );

    if (activeConfigurationId === configurationToRemove.id) {
      setActiveConfigurationId(null);
      setEditingSlotIndex(null);
    }
  };

  const removeConfiguration = (configurationId: string) => {
    const configurationToRemove = configurations.find(
      (configuration) => configuration.id === configurationId,
    );

    if (!configurationToRemove) return;

    revokeConfigurationPhotos(configurationToRemove);

    setConfigurations((currentConfigurations) =>
      currentConfigurations.filter(
        (configuration) => configuration.id !== configurationId,
      ),
    );

    if (activeConfigurationId === configurationId) {
      setActiveConfigurationId(null);
      setEditingSlotIndex(null);
    }
  };

  const changeQuantity = (
    configurationId: string,
    difference: number,
  ) => {
    const configuration = configurations.find(
      (currentConfiguration) =>
        currentConfiguration.id === configurationId,
    );

    if (!configuration) return;

    updateConfiguration(configurationId, {
      quantity: Math.max(1, configuration.quantity + difference),
    });
  };

  const openEditor = (configurationId: string) => {
    setActiveConfigurationId(configurationId);
    setEditingSlotIndex(null);
  };

  const closeEditor = () => {
    setActiveConfigurationId(null);
    setEditingSlotIndex(null);
  };

  const openPhotoPicker = (
    configurationId: string,
    slotIndex: number,
  ) => {
    setUploadTarget({
      configurationId,
      slotIndex,
    });

    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/") || !uploadTarget) {
      event.target.value = "";
      return;
    }

    const targetConfiguration = configurations.find(
      (configuration) => configuration.id === uploadTarget.configurationId,
    );

    const targetSlot =
      targetConfiguration?.slots[uploadTarget.slotIndex] ?? null;

    revokePhoto(targetSlot?.photo ?? null);

    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(objectUrl);

    updateSlot(
      uploadTarget.configurationId,
      uploadTarget.slotIndex,
      {
        photo: {
          name: file.name,
          src: objectUrl,
        },
        crop: {
          x: 0,
          y: 0,
        },
        zoom: 1,
        rotation: 0,
        croppedAreaPixels: null,
      },
    );

    setUploadTarget(null);
    event.target.value = "";
  };

  const removeSlotPhoto = (
    configurationId: string,
    slotIndex: number,
  ) => {
    const configuration = configurations.find(
      (currentConfiguration) =>
        currentConfiguration.id === configurationId,
    );

    const slot = configuration?.slots[slotIndex] ?? null;
    revokePhoto(slot?.photo ?? null);

    updateSlot(configurationId, slotIndex, {
      photo: null,
      crop: {
        x: 0,
        y: 0,
      },
      zoom: 1,
      rotation: 0,
      croppedAreaPixels: null,
    });

    if (
      activeConfigurationId === configurationId &&
      editingSlotIndex === slotIndex
    ) {
      setEditingSlotIndex(null);
    }
  };

  const createFinalPrint = async (
    configuration: PhotostripConfiguration,
  ) => {
    const template = templateMap.get(configuration.templateId);

    if (!template || !isConfigurationComplete(configuration)) {
      throw new Error("The photostrip is incomplete.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = template.outputWidth;
    canvas.height = template.outputHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("The print canvas could not be created.");
    }

    const templateImage = await loadImage(template.src);

    context.drawImage(
      templateImage,
      0,
      0,
      template.outputWidth,
      template.outputHeight,
    );

    const scaleX = template.outputWidth / template.sourceWidth;
    const scaleY = template.outputHeight / template.sourceHeight;

    for (const slot of configuration.slots) {
      if (!slot.photo) continue;

      const targetAspect = slot.geometry.width / slot.geometry.height;

      const cropPixels =
        slot.croppedAreaPixels ??
        (await getDefaultCrop(
          slot.photo.src,
          slot.rotation,
          targetAspect,
        ));

      const croppedPhotoUrl = await createCroppedImage(
        slot.photo.src,
        cropPixels,
        slot.rotation,
      );

      const croppedImage = await loadImage(croppedPhotoUrl);

      context.drawImage(
        croppedImage,
        slot.geometry.x * scaleX,
        slot.geometry.y * scaleY,
        slot.geometry.width * scaleX,
        slot.geometry.height * scaleY,
      );
    }

    return canvas.toDataURL("image/png");
  };

  const prepareCartItem = async (
    configuration: PhotostripConfiguration,
    index: number,
  ): Promise<NewCartItem> => {
    const template = templateMap.get(configuration.templateId);

    if (!template) {
      throw new Error("The selected template could not be found.");
    }

    const finalPrintUrl = await createFinalPrint(configuration);

    return {
      productType: "photostrip",
      name: `${template.name} ${
        template.format === "collage" ? "Photo Collage" : "Photostrip"
      } ${index + 1}`,
      unitPrice: BASE_PRICE,
      quantity: configuration.quantity,
      previewUrl: finalPrintUrl,
      options: {
        templateId: template.id,
        templateName: template.name,
        templateFormat: template.format,
        photoCount: String(configuration.slots.length),
        printSize: template.sizeLabel,
        printWidth: String(template.outputWidth),
        printHeight: String(template.outputHeight),
        assetType: "Print-ready PNG",
        configurationNumber: String(index + 1),
      },
      turnaround: "Up to 48hrs",
      editHref: "/products/photostrips",
      isFast: false,
    };
  };

  const handleAddToCart = async () => {
    if (!allConfigurationsComplete || isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartItems = await Promise.all(
        configurations.map(prepareCartItem),
      );

      addItems(cartItems);
      router.push("/cart");
    } catch (error) {
      console.error("Could not prepare photostrips:", error);

      window.alert(
        "Something went wrong while preparing your photostrips. Please check that every photo slot is complete and that the template files are in the correct public folder.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    if (!activeConfigurationId && !designPickerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (activeConfigurationId) {
        closeEditor();
        return;
      }

      setDesignPickerOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeConfigurationId, designPickerOpen]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  return (
    <>
      <section className="px-4 pb-28 pt-6 sm:px-5 md:px-7 md:pt-10 lg:pb-16 lg:pt-14">
        <div className="mx-auto max-w-[1240px]">
          {configurations.length === 0 ? (
            <div className="mx-auto max-w-[720px] rounded-[20px] border-2 border-ink bg-paper p-5 text-center shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-10">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-blush sm:h-14 sm:w-14">
                <LuImages className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>

              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                Create your photostrips
              </h2>

              <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-ink/60 sm:text-base">
                Choose one or more designs. Every selection becomes its own
                editable print with separate photos, crops and copy quantity.
              </p>

              <button
                type="button"
                disabled={isAddingToCart}
                onClick={() => setDesignPickerOpen(true)}
                className="mx-auto mt-6 flex items-center justify-center rounded-full border-2 border-ink bg-burgundy px-6 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LuPlus className="mr-2 h-5 w-5" />
                Choose designs
              </button>

              <p className="mt-4 text-xs font-semibold text-ink/50">
                {formatPrice(BASE_PRICE)} per finished design
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C] sm:text-base">
                    tiny strips, big memories
                  </span>

                  <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                    Your designs
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-ink/60 sm:text-sm sm:leading-6">
                    Open each strip to add its photos, adjust the crop and
                    choose the number of identical copies.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isAddingToCart}
                  onClick={() => setDesignPickerOpen(true)}
                  className="hidden shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#2A211C] sm:flex"
                >
                  <LuPlus className="mr-2 h-4 w-4" />
                  Add designs
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {configurations.map((configuration, index) => {
                  const template = templateMap.get(configuration.templateId);

                  if (!template) return null;

                  const completedSlots = configuration.slots.filter((slot) =>
                    Boolean(slot.photo),
                  ).length;

                  const isComplete = isConfigurationComplete(configuration);

                  return (
                    <article
                      key={configuration.id}
                      className="flex min-w-0 flex-col rounded-[14px] border-2 border-ink bg-paper p-2.5 shadow-[0_4px_0_rgba(42,33,28,0.1)] sm:rounded-[18px] sm:p-4"
                    >
                      <div className="flex min-h-[245px] items-center justify-center overflow-hidden rounded-[10px] bg-blush/50 p-3 sm:min-h-[360px] sm:p-5">
                        <PhotostripPreview
                          template={template}
                          slots={configuration.slots}
                          className={
                            template.format === "collage"
                              ? "max-w-[175px] sm:max-w-[230px]"
                              : "max-w-[105px] sm:max-w-[145px]"
                          }
                        />
                      </div>

                      <div className="flex flex-1 flex-col pt-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-bold text-ink sm:text-sm">
                              {template.name}
                              {templateCounts[template.id] > 1
                                ? ` · Strip ${
                                    configurations
                                      .filter(
                                        (currentConfiguration) =>
                                          currentConfiguration.templateId ===
                                          template.id,
                                      )
                                      .findIndex(
                                        (currentConfiguration) =>
                                          currentConfiguration.id ===
                                          configuration.id,
                                      ) + 1
                                  }`
                                : ""}
                            </h3>

                            <span
                              className={[
                                "mt-1 inline-flex items-center gap-1 text-[9px] font-bold sm:text-[10px]",
                                isComplete
                                  ? "text-burgundy"
                                  : "text-ink/45",
                              ].join(" ")}
                            >
                              {isComplete && <LuCheck className="h-3 w-3" />}
                              {completedSlots}/{configuration.slots.length}{" "}
                              photos ready
                            </span>
                          </div>

                          <button
                            type="button"
                            aria-label={`Remove photostrip ${index + 1}`}
                            disabled={isAddingToCart}
                            onClick={() =>
                              removeConfiguration(configuration.id)
                            }
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink/40 transition hover:bg-burgundy hover:text-cream sm:h-8 sm:w-8"
                          >
                            <LuTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isAddingToCart}
                          onClick={() => openEditor(configuration.id)}
                          className="mt-3 flex w-full items-center justify-center rounded-full border-2 border-ink bg-cream px-2 py-2 text-[10px] font-bold transition hover:bg-beige sm:text-xs"
                        >
                          <LuPencil className="mr-1.5 h-3.5 w-3.5" />
                          {isComplete ? "Edit strip" : "Add photos"}
                        </button>

                        <div className="mt-3 border-t border-dashed border-ink/20 pt-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold text-ink/55 sm:text-xs">
                              Copies
                            </span>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                type="button"
                                aria-label={`Decrease quantity for ${template.name}`}
                                disabled={
                                  configuration.quantity <= 1 ||
                                  isAddingToCart
                                }
                                onClick={() =>
                                  changeQuantity(configuration.id, -1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold disabled:opacity-40 sm:h-8 sm:w-8"
                              >
                                −
                              </button>

                              <span className="min-w-4 text-center font-serif text-sm font-bold sm:text-base">
                                {configuration.quantity}
                              </span>

                              <button
                                type="button"
                                aria-label={`Increase quantity for ${template.name}`}
                                disabled={isAddingToCart}
                                onClick={() =>
                                  changeQuantity(configuration.id, 1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold sm:h-8 sm:w-8"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <p className="mt-2 text-right text-[11px] font-bold text-burgundy sm:text-sm">
                            {formatPrice(
                              configuration.quantity * BASE_PRICE,
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}

                <button
                  type="button"
                  disabled={isAddingToCart}
                  onClick={() => setDesignPickerOpen(true)}
                  className="flex min-h-[340px] flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-ink bg-beige/40 p-4 text-center transition hover:bg-beige disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[480px] sm:rounded-[18px]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper sm:h-12 sm:w-12">
                    <LuPlus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>

                  <span className="mt-3 text-xs font-bold text-ink sm:text-sm">
                    Add more designs
                  </span>

                  <span className="mt-1 text-[10px] text-ink/50 sm:text-xs">
                    Each one can use different photos
                  </span>
                </button>
              </div>

              <div className="mt-8 rounded-[16px] border-2 border-ink bg-beige p-4 sm:mt-10 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-ink/55 sm:text-sm">
                      {configurations.length}{" "}
                      {configurations.length === 1 ? "design" : "designs"} ·{" "}
                      {totalPrints} total{" "}
                      {totalPrints === 1 ? "print" : "prints"}
                    </p>

                    <p className="mt-1 font-serif text-2xl font-bold text-burgundy sm:text-3xl">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>

                  <p className="text-right text-[10px] leading-4 text-ink/55 sm:text-xs sm:leading-5">
                    {completedConfigurations}/{configurations.length} ready
                    <br />
                    {orderSizeSummary} · Up to 48hrs
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-busy={isAddingToCart}
                disabled={!allConfigurationsComplete || isAddingToCart}
                onClick={handleAddToCart}
                className="mx-auto mt-6 hidden w-full max-w-[560px] items-center justify-center rounded-full border-2 border-ink bg-burgundy px-6 py-4 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
              >
                {isAddingToCart
                  ? "Preparing Your Photostrips…"
                  : !allConfigurationsComplete
                    ? `Finish ${
                        configurations.length - completedConfigurations
                      } ${
                        configurations.length - completedConfigurations === 1
                          ? "Design"
                          : "Designs"
                      }`
                    : `Add ${totalPrints} ${
                        totalPrints === 1 ? "Print" : "Prints"
                      } to Cart — ${formatPrice(totalPrice)}`}
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      {configurations.length > 0 && (
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
            disabled={!allConfigurationsComplete || isAddingToCart}
            onClick={handleAddToCart}
            className="flex flex-1 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAddingToCart
              ? "Preparing…"
              : !allConfigurationsComplete
                ? `Finish ${
                    configurations.length - completedConfigurations
                  }`
                : "Add to Cart"}
          </button>
        </div>
      )}

      {designPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose photostrip designs"
          className="fixed inset-0 z-[90] flex flex-col bg-cream lg:items-center lg:justify-center lg:bg-ink/50 lg:p-6"
        >
          <button
            type="button"
            aria-label="Close design picker"
            onClick={() => setDesignPickerOpen(false)}
            className="absolute inset-0 hidden lg:block"
          />

          <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-cream lg:h-auto lg:max-h-[92vh] lg:max-w-[980px] lg:rounded-[22px] lg:border-2 lg:border-ink lg:shadow-[10px_10px_0_#2A211C]">
            <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setDesignPickerOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-ink"
              >
                <LuArrowLeft className="h-5 w-5 lg:hidden" />
                <LuX className="hidden h-5 w-5 lg:block" />
                Back
              </button>

              <p className="text-xs font-bold text-ink/55 sm:text-sm">
                Choose your designs
              </p>

              <button
                type="button"
                onClick={() => setDesignPickerOpen(false)}
                className="rounded-full bg-burgundy px-3 py-2 text-xs font-bold text-cream sm:px-4"
              >
                Done
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
                pick your favourites ✦
              </span>

              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                Choose one or more designs
              </h2>

              <p className="mt-2 max-w-[620px] text-sm leading-6 text-ink/60">
                Adding the same design twice creates two independently editable
                prints. Use the copy quantity later when you want identical
                copies of one finished design.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
                {visibleTemplates.map((template) => {
                  const count = templateCounts[template.id] ?? 0;

                  return (
                    <article
                      key={template.id}
                      className={[
                        "rounded-[14px] border-2 p-2.5 transition sm:rounded-[18px] sm:p-4",
                        count > 0
                          ? "border-ink bg-blush shadow-[4px_4px_0_#2A211C]"
                          : "border-ink/20 bg-paper",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mx-auto w-full overflow-hidden bg-ink shadow-[2px_3px_0_rgba(42,33,28,0.14)]",
                          template.format === "collage"
                            ? "max-w-[145px] sm:max-w-[185px]"
                            : "max-w-[95px] sm:max-w-[120px]",
                        ].join(" ")}
                      >
                        <TemplateArtwork template={template} />
                      </div>

                      <div className="mt-3">
                        <p className="truncate text-xs font-bold text-ink sm:text-sm">
                          {template.name}
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-ink/50 sm:text-[10px]">
                          {template.slots.length} photos · {template.sizeLabel}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-ink/20 pt-3">
                        <span className="text-[9px] font-semibold text-ink/50 sm:text-[10px]">
                          {template.format === "collage"
                            ? "Photo collage"
                            : "Photostrip"}
                        </span>

                        {count === 0 ? (
                          <button
                            type="button"
                            onClick={() => increaseTemplateCount(template)}
                            className="flex h-8 items-center justify-center rounded-full border-2 border-ink bg-cream px-3 text-[10px] font-bold shadow-[2px_2px_0_#2A211C]"
                          >
                            <LuPlus className="mr-1 h-3.5 w-3.5" />
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Remove one ${template.name} strip`}
                              onClick={() => decreaseTemplateCount(template.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold"
                            >
                              −
                            </button>

                            <span className="min-w-4 text-center font-serif text-sm font-bold">
                              {count}
                            </span>

                            <button
                              type="button"
                              aria-label={`Add another ${template.name} strip`}
                              onClick={() => increaseTemplateCount(template)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {PHOTOSTRIP_TEMPLATES.length > INITIAL_TEMPLATE_COUNT && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllDesigns((currentValue) => !currentValue)
                  }
                  className="mx-auto mt-6 flex items-center gap-2 text-xs font-bold text-burgundy underline underline-offset-4 sm:text-sm"
                >
                  {showAllDesigns ? (
                    <>
                      Show fewer designs
                      <LuChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show more designs
                      <LuChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="border-t-2 border-ink bg-paper p-4 sm:px-6">
              <button
                type="button"
                disabled={configurations.length === 0}
                onClick={() => setDesignPickerOpen(false)}
                className="mx-auto flex w-full max-w-[520px] items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Done — {configurations.length}{" "}
                {configurations.length === 1 ? "Design" : "Designs"} Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {activeConfiguration && activeTemplate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${activeTemplate.name} design`}
          className="fixed inset-0 z-[95] flex flex-col bg-cream lg:items-center lg:justify-center lg:bg-ink/50 lg:p-6"
        >
          <button
            type="button"
            aria-label="Close photostrip editor"
            onClick={closeEditor}
            className="absolute inset-0 hidden lg:block"
          />

          <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-cream lg:h-auto lg:max-h-[94vh] lg:max-w-[1080px] lg:rounded-[22px] lg:border-2 lg:border-ink lg:shadow-[10px_10px_0_#2A211C]">
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

              <p className="max-w-[42vw] truncate text-xs font-bold text-ink/55 sm:text-sm">
                {activeTemplate.name} · {activeTemplate.sizeLabel}
              </p>

              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full bg-burgundy px-3 py-2 text-xs font-bold text-cream sm:px-4"
              >
                Done
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
              <div className="flex min-h-[520px] items-center justify-center bg-blush p-5 sm:min-h-[650px] sm:p-8 lg:min-h-[720px]">
                <PhotostripPreview
                  template={activeTemplate}
                  slots={activeConfiguration.slots}
                  editableSlotIndex={editingSlotIndex}
                  onSlotChange={(slotIndex, updates) =>
                    updateSlot(activeConfiguration.id, slotIndex, updates)
                  }
                  className={
                    activeTemplate.format === "collage"
                      ? "max-w-[300px] sm:max-w-[430px]"
                      : "max-w-[185px] sm:max-w-[235px]"
                  }
                />
              </div>

              <div className="bg-paper p-5 sm:p-7 lg:overflow-y-auto lg:p-8">
                {editingSlotIndex !== null && activeSlot?.photo ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingSlotIndex(null)}
                      className="flex items-center gap-2 text-xs font-bold text-burgundy underline underline-offset-4"
                    >
                      <LuArrowLeft className="h-4 w-4" />
                      Back to all photos
                    </button>

                    <span className="mt-5 inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
                      editing photo {editingSlotIndex + 1}
                    </span>

                    <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                      Adjust your photo
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-ink/60">
                      Drag the highlighted photo directly inside the strip,
                      then adjust its zoom or orientation.
                    </p>

                    <div className="mt-7">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <label htmlFor="photostrip-editor-zoom">Zoom</label>

                        <span className="text-ink/50">
                          {Math.round(activeSlot.zoom * 100)}%
                        </span>
                      </div>

                      <input
                        id="photostrip-editor-zoom"
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={activeSlot.zoom}
                        onChange={(event) =>
                          updateSlot(
                            activeConfiguration.id,
                            editingSlotIndex,
                            {
                              zoom: Number(event.target.value),
                            },
                          )
                        }
                        className="mt-4 w-full accent-burgundy"
                      />
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <p>Rotate photo</p>

                        <span className="text-ink/50">
                          {activeSlot.rotation}°
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {ROTATION_OPTIONS.map((rotation) => {
                          const isSelected =
                            activeSlot.rotation === rotation;

                          return (
                            <button
                              key={rotation}
                              type="button"
                              onClick={() =>
                                updateSlot(
                                  activeConfiguration.id,
                                  editingSlotIndex,
                                  {
                                    rotation,
                                    zoom: 1,
                                    crop: {
                                      x: 0,
                                      y: 0,
                                    },
                                    croppedAreaPixels: null,
                                  },
                                )
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
                      onClick={() => setEditingSlotIndex(null)}
                      className="mt-8 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
                    >
                      <LuCheck className="mr-2 h-5 w-5" />
                      Done editing photo
                    </button>
                  </>
                ) : (
                  <>
                    <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
                      build your strip ✦
                    </span>

                    <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                      Add your photos
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-ink/60">
                      Fill every opening, then edit only the crops that need a
                      little adjustment.
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {activeConfiguration.slots.map((slot, slotIndex) => (
                        <article
                          key={slot.id}
                          className="rounded-[14px] border-2 border-ink bg-cream p-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold text-ink sm:text-xs">
                              Photo {slotIndex + 1}
                            </p>

                            {slot.photo && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-burgundy text-cream">
                                <LuCheck className="h-3 w-3" />
                              </span>
                            )}
                          </div>

                          {!slot.photo ? (
                            <button
                              type="button"
                              disabled={isAddingToCart}
                              onClick={() =>
                                openPhotoPicker(
                                  activeConfiguration.id,
                                  slotIndex,
                                )
                              }
                              className="mt-2 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink/30 bg-paper text-center transition hover:bg-beige"
                            >
                              <LuImagePlus className="h-5 w-5" />
                              <span className="mt-2 text-[9px] font-bold sm:text-[10px]">
                                Choose photo
                              </span>
                            </button>
                          ) : (
                            <>
                              <div
                                className="relative mt-2 w-full overflow-hidden rounded-lg border-2 border-ink bg-beige"
                                style={{
                                  aspectRatio: `${slot.geometry.width} / ${slot.geometry.height}`,
                                }}
                              >
                                <Cropper
                                  image={slot.photo.src}
                                  crop={slot.crop}
                                  zoom={slot.zoom}
                                  rotation={slot.rotation}
                                  aspect={
                                    slot.geometry.width / slot.geometry.height
                                  }
                                  objectFit="cover"
                                  cropShape="rect"
                                  showGrid={false}
                                  restrictPosition
                                  onCropChange={() => undefined}
                                  onZoomChange={() => undefined}
                                  onCropComplete={() => undefined}
                                  style={{
                                    containerStyle: {
                                      position: "absolute",
                                      inset: 0,
                                      pointerEvents: "none",
                                    },
                                    cropAreaStyle: {
                                      border: "none",
                                      boxShadow: "none",
                                    },
                                    mediaStyle: {
                                      pointerEvents: "none",
                                    },
                                  }}
                                />
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPhotoPicker(
                                      activeConfiguration.id,
                                      slotIndex,
                                    )
                                  }
                                  className="rounded-full border-2 border-ink bg-paper px-2 py-2 text-[8px] font-bold sm:text-[9px]"
                                >
                                  Change
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingSlotIndex(slotIndex)
                                  }
                                  className="rounded-full border-2 border-ink bg-blush px-2 py-2 text-[8px] font-bold shadow-[1px_1px_0_#2A211C] sm:text-[9px]"
                                >
                                  Edit crop
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSlotPhoto(
                                    activeConfiguration.id,
                                    slotIndex,
                                  )
                                }
                                className="mt-2 flex w-full items-center justify-center text-[8px] font-bold text-ink/45 underline underline-offset-4"
                              >
                                <LuTrash2 className="mr-1 h-3 w-3" />
                                Remove photo
                              </button>
                            </>
                          )}
                        </article>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[14px] border-2 border-ink bg-beige p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-ink">
                            Identical copies
                          </p>

                          <p className="mt-1 text-[10px] leading-4 text-ink/50">
                            One copy is one finished {activeTemplate.sizeLabel}{" "}
                            {activeTemplate.format === "collage"
                              ? "collage"
                              : "strip"}.

                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={activeConfiguration.quantity <= 1}
                            onClick={() =>
                              changeQuantity(activeConfiguration.id, -1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold disabled:opacity-40"
                          >
                            −
                          </button>

                          <span className="min-w-4 text-center font-serif text-base font-bold">
                            {activeConfiguration.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(activeConfiguration.id, 1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeEditor}
                      className="mt-6 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
                    >
                      <LuCheck className="mr-2 h-5 w-5" />
                      Done with this strip
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotostripCustomizer;