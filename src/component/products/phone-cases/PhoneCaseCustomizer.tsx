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
  LuShoppingBag,
  LuSmartphone,
  LuTrash2,
  LuX,
} from "react-icons/lu";

import { useCart } from "@/context/CartContext";
import {
  phoneCaseModels,
  type PhoneCasePackage,
} from "@/data/phoneCaseModels";
import { createCroppedImage } from "@/lib/image/createCroppedImage";
import type { NewCartItem } from "@/types/cart";

const INITIAL_MODEL_COUNT = 8;

const ROTATION_OPTIONS = [
  0,
  90,
  180,
  270,
] as const;

/**
 * Position of the photo opening inside:
 * /public/images/polaroid-frame.svg
 *
 * Adjust these values slightly if your frame opening
 * sits somewhere else.
 */
const PHOTO_WINDOW = {
  left: "20%",
  top: "31%",
  width: "58%",
  height: "42%",
};

const caseSamples = [
  {
    src: "/images/phone-cases/sample-01.jpg",
    alt: "Finished custom Polaroid phone case",
  },
  {
    src: "/images/phone-cases/sample-02.jpg",
    alt: "Clear phone case with a custom Polaroid",
  },
  {
    src: "/images/phone-cases/sample-03.jpg",
    alt: "Personalised phone case order",
  },
];

type CropPosition = {
  x: number;
  y: number;
};

type UploadedPhoto = {
  name: string;
  src: string;
};

type CaseConfiguration = {
  id: string;
  modelId: string;
  packageType: PhoneCasePackage;
  photo: UploadedPhoto | null;
  crop: CropPosition;
  zoom: number;
  rotation: number;
  croppedAreaPixels: Area | null;
};

type PhoneCaseCustomizerProps = {
  editItemId?: string | null;
};

type PhoneCaseMockupProps = {
  modelName: string;
  packageType: PhoneCasePackage;
  photo: UploadedPhoto | null;
  configuration: CaseConfiguration;
  editable?: boolean;
  onChange?: (
    updates: Partial<CaseConfiguration>,
  ) => void;
  className?: string;
};

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const createConfiguration = (
  modelId: string,
): CaseConfiguration => {
  return {
    id: crypto.randomUUID(),
    modelId,
    packageType: "with-polaroid",
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

const isConfigurationComplete = (
  configuration: CaseConfiguration,
) => {
  return (
    configuration.packageType === "case-only" ||
    Boolean(configuration.photo)
  );
};

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);

      image.onerror = () => {
        reject(
          new Error(
            "The uploaded image could not be loaded.",
          ),
        );
      };

      image.src = src;
    },
  );
};

const getDefaultSquareCrop = async (
  imageSrc: string,
  rotation: number,
): Promise<Area> => {
  const image = await loadImage(imageSrc);

  const isSideways =
    rotation === 90 || rotation === 270;

  const rotatedWidth = isSideways
    ? image.naturalHeight
    : image.naturalWidth;

  const rotatedHeight = isSideways
    ? image.naturalWidth
    : image.naturalHeight;

  const cropSize = Math.min(
    rotatedWidth,
    rotatedHeight,
  );

  return {
    x: Math.round(
      (rotatedWidth - cropSize) / 2,
    ),
    y: Math.round(
      (rotatedHeight - cropSize) / 2,
    ),
    width: Math.round(cropSize),
    height: Math.round(cropSize),
  };
};

const createPersistentImageUrl = async (
  imageSrc: string,
) => {
  if (imageSrc.startsWith("data:")) {
    return imageSrc;
  }

  const response = await fetch(imageSrc);

  if (!response.ok) {
    throw new Error(
      "The original image could not be prepared.",
    );
  }

  const blob = await response.blob();

  return new Promise<string>(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result !== "string"
        ) {
          reject(
            new Error(
              "The original image could not be stored.",
            ),
          );

          return;
        }

        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error(
            "The original image could not be stored.",
          ),
        );
      };

      reader.readAsDataURL(blob);
    },
  );
};

const escapeXml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const createPhoneCaseCartPreview = (
  modelName: string,
  photoUrl?: string,
) => {
  const photoMarkup = photoUrl
    ? `
      <g transform="rotate(-7 300 320)">
        <rect
          x="218"
          y="220"
          width="164"
          height="205"
          fill="#FFFCF6"
          stroke="#2A211C"
          stroke-width="6"
        />

        <defs>
          <clipPath id="photoCrop">
            <rect
              x="231"
              y="234"
              width="138"
              height="138"
            />
          </clipPath>
        </defs>

        <image
          href="${escapeXml(photoUrl)}"
          x="231"
          y="234"
          width="138"
          height="138"
          preserveAspectRatio="xMidYMid slice"
          clip-path="url(#photoCrop)"
        />
      </g>
    `
    : `
      <rect
        x="218"
        y="245"
        width="164"
        height="120"
        rx="18"
        fill="none"
        stroke="#2A211C"
        stroke-width="4"
        stroke-dasharray="10 8"
        opacity="0.25"
      />

      <text
        x="300"
        y="315"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="20"
        font-weight="700"
        fill="#2A211C"
        opacity="0.45"
      >
        Case Only
      </text>
    `;

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="600"
      height="600"
      viewBox="0 0 600 600"
    >
      <rect
        width="600"
        height="600"
        fill="#E7D9C2"
      />

      <rect
        x="180"
        y="55"
        width="240"
        height="490"
        rx="52"
        fill="#FFFCF6"
        stroke="#2A211C"
        stroke-width="12"
      />

      <rect
        x="202"
        y="77"
        width="196"
        height="446"
        rx="40"
        fill="#F7F1E6"
        stroke="#2A211C"
        stroke-width="5"
        opacity="0.95"
      />

      <rect
        x="216"
        y="95"
        width="92"
        height="92"
        rx="26"
        fill="#E7D9C2"
        stroke="#2A211C"
        stroke-width="5"
      />

      <circle
        cx="244"
        cy="124"
        r="15"
        fill="#2A211C"
      />

      <circle
        cx="280"
        cy="124"
        r="15"
        fill="#2A211C"
      />

      <circle
        cx="244"
        cy="160"
        r="15"
        fill="#2A211C"
      />

      ${photoMarkup}

      <text
        x="300"
        y="505"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="18"
        font-weight="700"
        fill="#7A2333"
      >
        ${escapeXml(modelName)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    svg,
  )}`;
};

const PhoneCaseMockup = ({
  modelName,
  packageType,
  photo,
  configuration,
  editable = false,
  onChange,
  className = "",
}: PhoneCaseMockupProps) => {
  return (
    <div
      className={[
        "relative aspect-[9/18] w-full rounded-[38px] border-[5px] border-ink bg-paper shadow-[7px_9px_0_rgba(42,33,28,0.16)] sm:rounded-[46px] sm:border-[6px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-none absolute inset-2 z-30 rounded-[30px] border-2 border-white/70 bg-white/5 sm:rounded-[37px]" />

      <div className="absolute left-3 top-3 z-40 h-[62px] w-[62px] rounded-[19px] border-2 border-ink bg-beige shadow-[2px_2px_0_rgba(42,33,28,0.2)] sm:left-4 sm:top-4 sm:h-[78px] sm:w-[78px] sm:rounded-[23px]">
        <span className="absolute left-2.5 top-2.5 h-4 w-4 rounded-full border-2 border-ink bg-ink sm:left-3 sm:top-3 sm:h-5 sm:w-5" />

        <span className="absolute right-2.5 top-2.5 h-4 w-4 rounded-full border-2 border-ink bg-ink sm:right-3 sm:top-3 sm:h-5 sm:w-5" />

        <span className="absolute bottom-2.5 left-2.5 h-4 w-4 rounded-full border-2 border-ink bg-ink sm:bottom-3 sm:left-3 sm:h-5 sm:w-5" />

        <span className="absolute bottom-3 right-3 h-2.5 w-2.5 rounded-full bg-gold sm:bottom-4 sm:right-4 sm:h-3 sm:w-3" />
      </div>

      {packageType === "with-polaroid" &&
        photo && (
          <div className="absolute left-[22%] top-[31%] z-10 w-[57%] -rotate-6">
            <div className="relative w-full">
              <img
                src="/images/polaroid-frame.svg"
                alt=""
                aria-hidden="true"
                draggable={false}
                className="invisible block h-auto w-full select-none"
              />

              <div
                className="absolute z-0 overflow-hidden bg-beige"
                style={PHOTO_WINDOW}
              >
                <Cropper
                  image={photo.src}
                  crop={configuration.crop}
                  zoom={configuration.zoom}
                  rotation={
                    configuration.rotation
                  }
                  aspect={1}
                  objectFit="cover"
                  cropShape="rect"
                  showGrid={false}
                  restrictPosition
                  onCropChange={(crop) => {
                    if (!editable) return;

                    onChange?.({
                      crop,
                    });
                  }}
                  onZoomChange={(zoom) => {
                    if (!editable) return;

                    onChange?.({
                      zoom,
                    });
                  }}
                  onCropComplete={(
                    _,
                    croppedAreaPixels,
                  ) => {
                    if (!editable) return;

                    onChange?.({
                      croppedAreaPixels,
                    });
                  }}
                  style={{
                    containerStyle: {
                      position: "absolute",
                      inset: 0,
                      pointerEvents: editable
                        ? "auto"
                        : "none",
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

              <img
                src="/images/polaroid-frame.svg"
                alt="Polaroid inside phone case"
                draggable={false}
                className="pointer-events-none absolute inset-0 z-10 block h-full w-full select-none"
              />
            </div>
          </div>
        )}

      {packageType === "with-polaroid" &&
        !photo && (
          <div className="absolute left-[22%] top-[34%] z-10 flex aspect-[3/4] w-[57%] -rotate-6 items-center justify-center border-2 border-dashed border-ink/30 bg-paper p-3 text-center text-[9px] font-bold leading-4 text-ink/40">
            Upload a photo for this case
          </div>
        )}

      {packageType === "case-only" && (
        <div className="absolute inset-x-5 bottom-24 rounded-xl border-2 border-dashed border-ink/20 p-4 text-center sm:bottom-28">
          <LuSmartphone className="mx-auto h-6 w-6 text-ink/35" />

          <p className="mt-2 text-[10px] font-bold text-ink/40 sm:text-xs">
            Clear case only
          </p>
        </div>
      )}

      <div className="absolute inset-x-4 bottom-5 text-center sm:inset-x-5 sm:bottom-7">
        <p className="truncate text-[9px] font-bold text-ink/45 sm:text-[11px]">
          {modelName}
        </p>
      </div>
    </div>
  );
};

const PhoneCaseCustomizer = ({
  editItemId = null,
}: PhoneCaseCustomizerProps) => {
  const router = useRouter();

  const {
    items,
    isReady,
    addItems,
    updateItem,
  } = useCart();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const objectUrlsRef = useRef<Set<string>>(
    new Set(),
  );

  const loadedEditItemIdRef = useRef<
    string | null
  >(null);

  const [configurations, setConfigurations] =
    useState<CaseConfiguration[]>([]);

  const [
    expandedConfigurationId,
    setExpandedConfigurationId,
  ] = useState<string | null>(null);

  const [
    uploadTargetConfigurationId,
    setUploadTargetConfigurationId,
  ] = useState<string | null>(null);

  const [
    editingConfigurationId,
    setEditingConfigurationId,
  ] = useState<string | null>(null);

  const [showAllModels, setShowAllModels] =
    useState(false);

  const [isAddingToCart, setIsAddingToCart] =
    useState(false);

  const [successModalOpen, setSuccessModalOpen] =
    useState(false);

  const editingCartItem = useMemo(() => {
    if (!editItemId) return null;

    return (
      items.find(
        (item) => item.id === editItemId,
      ) ?? null
    );
  }, [editItemId, items]);

  const modelMap = useMemo(() => {
    return new Map(
      phoneCaseModels.map((model) => [
        model.id,
        model,
      ]),
    );
  }, []);

  const orderedModels = useMemo(() => {
    return [...phoneCaseModels].reverse();
  }, []);

  const modelCounts = useMemo(() => {
    return configurations.reduce<
      Record<string, number>
    >((counts, configuration) => {
      counts[configuration.modelId] =
        (counts[configuration.modelId] ?? 0) +
        1;

      return counts;
    }, {});
  }, [configurations]);

  const selectedModelIds = useMemo(() => {
    return new Set(
      configurations.map(
        (configuration) =>
          configuration.modelId,
      ),
    );
  }, [configurations]);

  const visibleModels = useMemo(() => {
    if (showAllModels) {
      return orderedModels;
    }

    const latestModels = orderedModels.slice(
      0,
      INITIAL_MODEL_COUNT,
    );

    const hiddenSelectedModels =
      orderedModels.filter(
        (model) =>
          selectedModelIds.has(model.id) &&
          !latestModels.some(
            (latestModel) =>
              latestModel.id === model.id,
          ),
      );

    return [
      ...hiddenSelectedModels,
      ...latestModels,
    ].slice(0, INITIAL_MODEL_COUNT);
  }, [
    orderedModels,
    selectedModelIds,
    showAllModels,
  ]);

  const editingConfiguration =
    useMemo(() => {
      return (
        configurations.find(
          (configuration) =>
            configuration.id ===
            editingConfigurationId,
        ) ?? null
      );
    }, [
      configurations,
      editingConfigurationId,
    ]);

  const editingPhoto =
    editingConfiguration?.photo ?? null;

  const completedConfigurations =
    useMemo(() => {
      return configurations.filter(
        isConfigurationComplete,
      ).length;
    }, [configurations]);

  const allConfigurationsComplete =
    configurations.length > 0 &&
    completedConfigurations ===
      configurations.length;

  const totalPrice = useMemo(() => {
    return configurations.reduce(
      (total, configuration) => {
        const model = modelMap.get(
          configuration.modelId,
        );

        if (!model) return total;

        const price =
          configuration.packageType ===
          "with-polaroid"
            ? model.withPolaroidPrice
            : model.caseOnlyPrice;

        return total + price;
      },
      0,
    );
  }, [configurations, modelMap]);

  const updateConfiguration = (
    configurationId: string,
    updates: Partial<CaseConfiguration>,
  ) => {
    setConfigurations(
      (currentConfigurations) =>
        currentConfigurations.map(
          (configuration) =>
            configuration.id ===
            configurationId
              ? {
                  ...configuration,
                  ...updates,
                }
              : configuration,
        ),
    );
  };

  const revokeConfigurationPhoto = (
    configuration:
      | CaseConfiguration
      | undefined,
  ) => {
    const photoUrl =
      configuration?.photo?.src;

    if (
      photoUrl &&
      objectUrlsRef.current.has(photoUrl)
    ) {
      URL.revokeObjectURL(photoUrl);

      objectUrlsRef.current.delete(photoUrl);
    }
  };

  const increaseModelQuantity = (
    modelId: string,
  ) => {
    if (editItemId) {
      const existingConfiguration =
        configurations[0];

      if (existingConfiguration) {
        updateConfiguration(
          existingConfiguration.id,
          {
            modelId,
          },
        );
      } else {
        const configuration =
          createConfiguration(modelId);

        setConfigurations([
          configuration,
        ]);

        setExpandedConfigurationId(
          configuration.id,
        );
      }

      return;
    }

    const newConfiguration =
      createConfiguration(modelId);

    setConfigurations(
      (currentConfigurations) => [
        ...currentConfigurations,
        newConfiguration,
      ],
    );

    setExpandedConfigurationId(
      newConfiguration.id,
    );
  };

  const decreaseModelQuantity = (
    modelId: string,
  ) => {
    if (editItemId) return;

    const matchingConfigurations =
      configurations.filter(
        (configuration) =>
          configuration.modelId === modelId,
      );

    const configurationToRemove =
      matchingConfigurations[
        matchingConfigurations.length - 1
      ];

    if (!configurationToRemove) return;

    revokeConfigurationPhoto(
      configurationToRemove,
    );

    setConfigurations(
      (currentConfigurations) =>
        currentConfigurations.filter(
          (configuration) =>
            configuration.id !==
            configurationToRemove.id,
        ),
    );

    if (
      expandedConfigurationId ===
      configurationToRemove.id
    ) {
      setExpandedConfigurationId(null);
    }

    if (
      editingConfigurationId ===
      configurationToRemove.id
    ) {
      setEditingConfigurationId(null);
    }

    if (
      uploadTargetConfigurationId ===
      configurationToRemove.id
    ) {
      setUploadTargetConfigurationId(null);
    }
  };

  const selectModel = (
    modelId: string,
  ) => {
    const currentCount =
      modelCounts[modelId] ?? 0;

    if (editItemId) {
      increaseModelQuantity(modelId);
      return;
    }

    if (currentCount === 0) {
      increaseModelQuantity(modelId);
    }
  };

  const openPhotoPicker = (
    configurationId: string,
  ) => {
    setUploadTargetConfigurationId(
      configurationId,
    );

    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (
      !file ||
      !file.type.startsWith("image/") ||
      !uploadTargetConfigurationId
    ) {
      event.target.value = "";
      return;
    }

    const targetConfiguration =
      configurations.find(
        (configuration) =>
          configuration.id ===
          uploadTargetConfigurationId,
      );

    revokeConfigurationPhoto(
      targetConfiguration,
    );

    const objectUrl =
      URL.createObjectURL(file);

    objectUrlsRef.current.add(
      objectUrl,
    );

    updateConfiguration(
      uploadTargetConfigurationId,
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

    setExpandedConfigurationId(
      uploadTargetConfigurationId,
    );

    setUploadTargetConfigurationId(null);

    event.target.value = "";
  };

  const removeConfigurationPhoto = (
    configurationId: string,
  ) => {
    const configuration =
      configurations.find(
        (currentConfiguration) =>
          currentConfiguration.id ===
          configurationId,
      );

    revokeConfigurationPhoto(
      configuration,
    );

    updateConfiguration(
      configurationId,
      {
        photo: null,
        crop: {
          x: 0,
          y: 0,
        },
        zoom: 1,
        rotation: 0,
        croppedAreaPixels: null,
      },
    );

    if (
      editingConfigurationId ===
      configurationId
    ) {
      setEditingConfigurationId(null);
    }
  };

  const setConfigurationPackage = (
    configurationId: string,
    packageType: PhoneCasePackage,
  ) => {
    updateConfiguration(
      configurationId,
      {
        packageType,
      },
    );
  };

  const openPhotoEditor = (
    configurationId: string,
  ) => {
    setEditingConfigurationId(
      configurationId,
    );
  };

  const closePhotoEditor = () => {
    setEditingConfigurationId(null);
  };

  const prepareCartItem = async (
    configuration: CaseConfiguration,
    index: number,
  ): Promise<NewCartItem> => {
    const model = modelMap.get(
      configuration.modelId,
    );

    if (!model) {
      throw new Error(
        "The selected phone model could not be found.",
      );
    }

    const unitPrice =
      configuration.packageType ===
      "with-polaroid"
        ? model.withPolaroidPrice
        : model.caseOnlyPrice;

    if (
      configuration.packageType ===
      "case-only"
    ) {
      return {
        productType: "phone-case",

        name: `${model.name} Clear Phone Case`,

        unitPrice,
        quantity: 1,

        previewUrl:
          createPhoneCaseCartPreview(
            model.name,
          ),

        options: {
          packageType: "case-only",
          packageLabel: "Case Only",
          phoneModelId: model.id,
          phoneModel: model.name,
          caseStyle: "Clear",
          configurationNumber: String(
            index + 1,
          ),
        },

        turnaround: "Ready in 48hrs",
        editHref:
          "/products/phone-cases",
        isFast: false,
      };
    }

    const assignedPhoto =
      configuration.photo;

    if (!assignedPhoto) {
      throw new Error(
        `A photo has not been uploaded for ${model.name}.`,
      );
    }

    const cropPixels =
      configuration.croppedAreaPixels ??
      (await getDefaultSquareCrop(
        assignedPhoto.src,
        configuration.rotation,
      ));

    const croppedPhotoUrl =
      await createCroppedImage(
        assignedPhoto.src,
        cropPixels,
        configuration.rotation,
      );

    const sourceImageUrl =
      await createPersistentImageUrl(
        assignedPhoto.src,
      );

    return {
      productType: "phone-case",

      name: `${model.name} Polaroid Phone Case`,

      unitPrice,
      quantity: 1,

      previewUrl:
        createPhoneCaseCartPreview(
          model.name,
          croppedPhotoUrl,
        ),

      sourceImageUrl,

      crop: configuration.crop,
      croppedAreaPixels: cropPixels,
      zoom: configuration.zoom,
      rotation: configuration.rotation,

      options: {
        packageType: "with-polaroid",
        packageLabel:
          "Polaroid + Case",
        phoneModelId: model.id,
        phoneModel: model.name,
        caseStyle: "Clear",
        photoName: assignedPhoto.name,
        configurationNumber: String(
          index + 1,
        ),
      },

      turnaround: "Ready in 48hrs",
      editHref:
        "/products/phone-cases",
      isFast: false,
    };
  };

  const handleAddToCart = async () => {
    if (
      !allConfigurationsComplete ||
      isAddingToCart
    ) {
      return;
    }

    setIsAddingToCart(true);

    try {
      if (editItemId) {
        const updatedItem =
          await prepareCartItem(
            configurations[0],
            0,
          );

        updateItem(
          editItemId,
          updatedItem,
        );

        router.push("/cart");
        return;
      }

      const newCartItems =
        await Promise.all(
          configurations.map(
            prepareCartItem,
          ),
        );

      addItems(newCartItems);

      setSuccessModalOpen(true);
    } catch (error) {
      console.error(
        "Could not prepare phone cases:",
        error,
      );

      window.alert(
        "Something went wrong while preparing your phone cases. Please check that every Polaroid + Case configuration has a photo.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    if (
      !editItemId ||
      !isReady ||
      loadedEditItemIdRef.current ===
        editItemId
    ) {
      return;
    }

    if (!editingCartItem) {
      router.replace("/cart");
      return;
    }

    const packageType:
      PhoneCasePackage =
      editingCartItem.options
        ?.packageType === "case-only"
        ? "case-only"
        : "with-polaroid";

    const modelId =
      editingCartItem.options
        ?.phoneModelId ??
      phoneCaseModels[0]?.id;

    if (!modelId) {
      router.replace("/cart");
      return;
    }

    const configurationId =
      crypto.randomUUID();

    const savedPhoto =
      packageType === "with-polaroid" &&
      (editingCartItem.sourceImageUrl ||
        editingCartItem.previewUrl)
        ? {
            name:
              editingCartItem.options
                ?.photoName ??
              editingCartItem.name,
            src:
              editingCartItem
                .sourceImageUrl ??
              editingCartItem.previewUrl,
          }
        : null;

    setConfigurations([
      {
        id: configurationId,
        modelId,
        packageType,
        photo: savedPhoto,

        crop:
          editingCartItem.crop ?? {
            x: 0,
            y: 0,
          },

        zoom:
          editingCartItem.zoom ?? 1,

        rotation:
          editingCartItem.rotation ??
          0,

        croppedAreaPixels:
          editingCartItem
            .croppedAreaPixels ??
          null,
      },
    ]);

    setExpandedConfigurationId(
      configurationId,
    );

    loadedEditItemIdRef.current =
      editItemId;
  }, [
    editItemId,
    editingCartItem,
    isReady,
    router,
  ]);

  useEffect(() => {
    if (!editingConfigurationId) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        closePhotoEditor();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [editingConfigurationId]);

  useEffect(() => {
    const objectUrls =
      objectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      objectUrls.clear();
    };
  }, []);

  return (
    <>
      <section className="px-4 pb-28 pt-6 sm:px-5 md:px-7 md:pt-10 lg:pb-20 lg:pt-14">
        <div className="mx-auto grid max-w-[1240px] items-start gap-7 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-10">
          <div className="min-w-0 space-y-6">
            {/* Step 1: Select models */}
            <section className="rounded-[18px] border-2 border-ink bg-paper p-4 shadow-[0_5px_0_rgba(42,33,28,0.08)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-burgundy font-serif text-sm font-bold text-cream sm:h-10 sm:w-10">
                  1
                </span>

                <div>
                  <h2 className="font-serif text-xl font-semibold text-ink sm:text-2xl">
                    Select your phone case
                    {editItemId ? "" : "s"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-ink/60 sm:text-sm sm:leading-6">
                    {editItemId
                      ? "Choose the iPhone model for this case."
                      : "Choose one or more iPhone models. Increase the quantity when you need several cases."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-3">
                {visibleModels.map(
                  (model) => {
                    const quantity =
                      modelCounts[
                        model.id
                      ] ?? 0;

                    const isSelected =
                      quantity > 0;

                    return (
                      <div
                        key={model.id}
                        className={[
                          "relative min-h-[76px] rounded-xl border-2 p-2.5 transition sm:min-h-[86px] sm:p-3",

                          isSelected
                            ? "border-ink bg-blush shadow-[3px_3px_0_#2A211C]"
                            : model.inStock
                              ? "border-ink/20 bg-cream hover:border-ink hover:bg-beige"
                              : "border-ink/10 bg-ink/5 opacity-45",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          disabled={
                            !model.inStock ||
                            isAddingToCart
                          }
                          onClick={() =>
                            selectModel(
                              model.id,
                            )
                          }
                          className="absolute inset-0 rounded-xl"
                          aria-label={`Select ${model.name}`}
                        />

                        <div className="pointer-events-none relative z-10 flex items-start gap-2">
                          <span
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",

                              isSelected
                                ? "border-ink bg-burgundy text-cream"
                                : "border-ink/30 bg-transparent",
                            ].join(" ")}
                          >
                            {isSelected && (
                              <LuCheck className="h-3 w-3" />
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="text-[10px] font-bold leading-4 text-ink sm:text-xs">
                              {model.name}
                            </p>

                            {!model.inStock && (
                              <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-burgundy">
                                Out of stock
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected &&
                          !editItemId && (
                            <div className="relative z-20 mt-3 flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                aria-label={`Decrease ${model.name} quantity`}
                                disabled={
                                  isAddingToCart
                                }
                                onClick={() =>
                                  decreaseModelQuantity(
                                    model.id,
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold"
                              >
                                −
                              </button>

                              <span className="min-w-4 text-center font-serif text-sm font-bold">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                aria-label={`Increase ${model.name} quantity`}
                                disabled={
                                  isAddingToCart
                                }
                                onClick={() =>
                                  increaseModelQuantity(
                                    model.id,
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          )}
                      </div>
                    );
                  },
                )}
              </div>

              {orderedModels.length >
                INITIAL_MODEL_COUNT && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllModels(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                  className="mx-auto mt-5 flex items-center gap-2 text-xs font-bold text-burgundy underline underline-offset-4 sm:text-sm"
                >
                  {showAllModels ? (
                    <>
                      Show fewer models
                      <LuChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show more models
                      <LuChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}

              {configurations.length >
                0 && (
                <div className="mt-5 flex items-center justify-between rounded-xl bg-beige px-3 py-2.5 text-xs font-semibold text-ink/65 sm:px-4 sm:text-sm">
                  <span>
                    {configurations.length}{" "}
                    {configurations.length ===
                    1
                      ? "case"
                      : "cases"}{" "}
                    selected
                  </span>

                  <span className="font-bold text-burgundy">
                    Continue below ↓
                  </span>
                </div>
              )}
            </section>

            {/* Step 2: Configure each case */}
            {configurations.length >
              0 && (
                <section className="rounded-[18px] border-2 border-ink bg-paper p-4 shadow-[0_5px_0_rgba(42,33,28,0.08)] sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-burgundy font-serif text-sm font-bold text-cream sm:h-10 sm:w-10">
                      2
                    </span>

                    <div className="min-w-0">
                      <h2 className="font-serif text-xl font-semibold text-ink sm:text-2xl">
                        Customise each case
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-ink/60 sm:text-sm sm:leading-6">
                        Choose the package and
                        photo for each physical
                        case separately.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 sm:mt-6">
                    {configurations.map(
                      (
                        configuration,
                        configurationIndex,
                      ) => {
                        const model =
                          modelMap.get(
                            configuration.modelId,
                          );

                        if (!model) {
                          return null;
                        }

                        const matchingCases =
                          configurations.filter(
                            (
                              currentConfiguration,
                            ) =>
                              currentConfiguration.modelId ===
                              configuration.modelId,
                          );

                        const caseNumber =
                          matchingCases.findIndex(
                            (
                              currentConfiguration,
                            ) =>
                              currentConfiguration.id ===
                              configuration.id,
                          ) + 1;

                        const isExpanded =
                          expandedConfigurationId ===
                          configuration.id;

                        const isComplete =
                          isConfigurationComplete(
                            configuration,
                          );

                        const configurationPrice =
                          configuration.packageType ===
                          "with-polaroid"
                            ? model.withPolaroidPrice
                            : model.caseOnlyPrice;

                        const showCaseNumber =
                          matchingCases.length >
                          1;

                        return (
                          <article
                            key={
                              configuration.id
                            }
                            className={[
                              "overflow-hidden rounded-[16px] border-2 transition",

                              isComplete
                                ? "border-ink bg-cream"
                                : "border-burgundy bg-blush/30",
                            ].join(" ")}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedConfigurationId(
                                  isExpanded
                                    ? null
                                    : configuration.id,
                                )
                              }
                              className="flex w-full items-center justify-between gap-3 p-3.5 text-left sm:p-4"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={[
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-bold",

                                    isComplete
                                      ? "bg-burgundy text-cream"
                                      : "bg-paper text-burgundy",
                                  ].join(" ")}
                                >
                                  {isComplete ? (
                                    <LuCheck className="h-4 w-4" />
                                  ) : (
                                    configurationIndex +
                                    1
                                  )}
                                </span>

                                <div className="min-w-0">
                                  <h3 className="truncate font-serif text-sm font-semibold text-ink sm:text-base">
                                    {model.name}
                                    {showCaseNumber
                                      ? ` — Case ${caseNumber}`
                                      : ""}
                                  </h3>

                                  <p className="mt-0.5 truncate text-[10px] font-semibold text-ink/50 sm:text-xs">
                                    {configuration.packageType ===
                                    "with-polaroid"
                                      ? configuration.photo
                                        ? "Polaroid + Case · Photo uploaded"
                                        : "Polaroid + Case · Needs a photo"
                                      : "Case Only · Ready"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-3">
                                <span className="hidden text-xs font-bold text-burgundy sm:block">
                                  {formatPrice(
                                    configurationPrice,
                                  )}
                                </span>

                                {isExpanded ? (
                                  <LuChevronUp className="h-5 w-5" />
                                ) : (
                                  <LuChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t-2 border-ink/10 p-3.5 sm:p-5">
                                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_230px]">
                                  <div>
                                    <p className="text-xs font-bold text-ink">
                                      Choose package
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                                      <button
                                        type="button"
                                        disabled={
                                          isAddingToCart
                                        }
                                        onClick={() =>
                                          setConfigurationPackage(
                                            configuration.id,
                                            "with-polaroid",
                                          )
                                        }
                                        className={[
                                          "rounded-xl border-2 p-3 text-left transition",

                                          configuration.packageType ===
                                          "with-polaroid"
                                            ? "border-ink bg-blush shadow-[3px_3px_0_#2A211C]"
                                            : "border-ink/20 bg-paper hover:border-ink",
                                        ].join(
                                          " ",
                                        )}
                                      >
                                        <LuImages className="h-5 w-5" />

                                        <p className="mt-2 text-xs font-bold leading-4 sm:text-sm">
                                          Polaroid +
                                          Case
                                        </p>

                                        <p className="mt-1 text-[9px] leading-4 text-ink/50 sm:text-[10px]">
                                          Clear case
                                          with one
                                          custom
                                          Polaroid
                                        </p>

                                        <p className="mt-2 text-xs font-bold text-burgundy">
                                          {formatPrice(
                                            model.withPolaroidPrice,
                                          )}
                                        </p>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          isAddingToCart
                                        }
                                        onClick={() =>
                                          setConfigurationPackage(
                                            configuration.id,
                                            "case-only",
                                          )
                                        }
                                        className={[
                                          "rounded-xl border-2 p-3 text-left transition",

                                          configuration.packageType ===
                                          "case-only"
                                            ? "border-ink bg-beige shadow-[3px_3px_0_#2A211C]"
                                            : "border-ink/20 bg-paper hover:border-ink",
                                        ].join(
                                          " ",
                                        )}
                                      >
                                        <LuSmartphone className="h-5 w-5" />

                                        <p className="mt-2 text-xs font-bold leading-4 sm:text-sm">
                                          Case Only
                                        </p>

                                        <p className="mt-1 text-[9px] leading-4 text-ink/50 sm:text-[10px]">
                                          Clear case
                                          without a
                                          printed
                                          Polaroid
                                        </p>

                                        <p className="mt-2 text-xs font-bold text-burgundy">
                                          {formatPrice(
                                            model.caseOnlyPrice,
                                          )}
                                        </p>
                                      </button>
                                    </div>

                                    {configuration.packageType ===
                                      "with-polaroid" && (
                                      <div className="mt-6">
                                        <p className="text-xs font-bold text-ink">
                                          Add a photo
                                          for this case
                                        </p>

                                        {!configuration.photo ? (
                                          <button
                                            type="button"
                                            disabled={
                                              isAddingToCart
                                            }
                                            onClick={() =>
                                              openPhotoPicker(
                                                configuration.id,
                                              )
                                            }
                                            className="mt-3 flex w-full flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-ink bg-paper px-4 py-7 text-center transition hover:bg-beige disabled:opacity-50"
                                          >
                                            <LuImagePlus className="h-6 w-6" />

                                            <span className="mt-2 text-xs font-bold sm:text-sm">
                                              Upload
                                              photo
                                            </span>

                                            <span className="mt-1 text-[10px] text-ink/50">
                                              JPG, PNG
                                              or WebP
                                            </span>
                                          </button>
                                        ) : (
                                          <div className="mt-3 rounded-[14px] border-2 border-ink bg-paper p-3">
                                            <div className="flex items-center gap-3">
                                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-ink bg-beige">
                                                <img
                                                  src={
                                                    configuration
                                                      .photo
                                                      .src
                                                  }
                                                  alt={`Photo for ${model.name}`}
                                                  className="h-full w-full object-cover"
                                                />
                                              </div>

                                              <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-bold text-ink">
                                                  {
                                                    configuration
                                                      .photo
                                                      .name
                                                  }
                                                </p>

                                                <p className="mt-1 text-[10px] text-ink/50">
                                                  Photo
                                                  uploaded
                                                </p>
                                              </div>

                                              <button
                                                type="button"
                                                aria-label="Remove uploaded photo"
                                                disabled={
                                                  isAddingToCart
                                                }
                                                onClick={() =>
                                                  removeConfigurationPhoto(
                                                    configuration.id,
                                                  )
                                                }
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/40 transition hover:bg-burgundy hover:text-cream"
                                              >
                                                <LuTrash2 className="h-4 w-4" />
                                              </button>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                              <button
                                                type="button"
                                                disabled={
                                                  isAddingToCart
                                                }
                                                onClick={() =>
                                                  openPhotoPicker(
                                                    configuration.id,
                                                  )
                                                }
                                                className="flex items-center justify-center rounded-full border-2 border-ink bg-cream px-3 py-2.5 text-[10px] font-bold transition hover:bg-beige sm:text-xs"
                                              >
                                                <LuImagePlus className="mr-1.5 h-4 w-4" />

                                                Change
                                                photo
                                              </button>

                                              <button
                                                type="button"
                                                disabled={
                                                  isAddingToCart
                                                }
                                                onClick={() =>
                                                  openPhotoEditor(
                                                    configuration.id,
                                                  )
                                                }
                                                className="flex items-center justify-center rounded-full border-2 border-ink bg-blush px-3 py-2.5 text-[10px] font-bold shadow-[2px_2px_0_#2A211C] sm:text-xs"
                                              >
                                                <LuPencil className="mr-1.5 h-4 w-4" />

                                                Edit
                                                position
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-center rounded-[14px] bg-blush/50 p-4">
                                    <PhoneCaseMockup
                                      modelName={
                                        model.name
                                      }
                                      packageType={
                                        configuration.packageType
                                      }
                                      photo={
                                        configuration.photo
                                      }
                                      configuration={
                                        configuration
                                      }
                                      className="max-w-[145px] sm:max-w-[175px]"
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink/20 pt-3">
                                  <span
                                    className={[
                                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold",

                                      isComplete
                                        ? "bg-burgundy text-cream"
                                        : "bg-paper text-burgundy",
                                    ].join(" ")}
                                  >
                                    {isComplete && (
                                      <LuCheck className="h-3 w-3" />
                                    )}

                                    {isComplete
                                      ? "Configuration ready"
                                      : "Upload a photo to continue"}
                                  </span>

                                  <span className="text-xs font-bold text-burgundy">
                                    {formatPrice(
                                      configurationPrice,
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      },
                    )}
                  </div>
                </section>
              )}

            {configurations.length >
              0 && (
                <section className="rounded-[18px] border-2 border-ink bg-beige p-4 lg:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-ink/55">
                        {
                          configurations.length
                        }{" "}
                        {configurations.length ===
                        1
                          ? "case"
                          : "cases"}
                      </p>

                      <p className="mt-1 font-serif text-2xl font-bold text-burgundy">
                        {formatPrice(
                          totalPrice,
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-ink/50">
                        {
                          completedConfigurations
                        }
                        /
                        {
                          configurations.length
                        }{" "}
                        configured
                      </p>

                      <p className="mt-1 text-[10px] text-ink/50">
                        Ready in 48hrs
                      </p>
                    </div>
                  </div>
                </section>
              )}

            {!editItemId && (
              <section className="pt-3 sm:pt-6">
                <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-paper px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
                  real results ✦
                </span>

                <h2 className="mt-4 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                  Want to see how yours
                  might turn out?
                </h2>

                <p className="mt-2 max-w-[580px] text-sm leading-6 text-ink/60">
                  Take a look at some
                  finished PolaroidsBySolly
                  cases before creating
                  yours.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {caseSamples.map(
                    (
                      sample,
                      sampleIndex,
                    ) => (
                      <div
                        key={sample.src}
                        className={[
                          "relative overflow-hidden rounded-[16px] border-2 border-ink bg-beige shadow-[3px_4px_0_rgba(42,33,28,0.12)]",

                          sampleIndex === 2
                            ? "col-span-2 aspect-[16/10] sm:col-span-1 sm:aspect-[4/5]"
                            : "aspect-[4/5]",
                        ].join(" ")}
                      >
                        <img
                          src={sample.src}
                          alt={sample.alt}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <div className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[6px_7px_0_rgba(42,33,28,0.12)]">
              <div className="flex items-center gap-2">
                <LuShoppingBag className="h-5 w-5" />

                <h2 className="font-serif text-xl font-semibold">
                  Order summary
                </h2>
              </div>

              {configurations.length ===
              0 ? (
                <div className="mt-5 rounded-xl border-2 border-dashed border-ink/20 bg-cream p-5 text-center">
                  <LuSmartphone className="mx-auto h-6 w-6 text-ink/35" />

                  <p className="mt-2 text-xs font-semibold leading-5 text-ink/50">
                    Select a phone model to
                    start building your
                    order.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5 space-y-3">
                    {configurations.map(
                      (configuration) => {
                        const model =
                          modelMap.get(
                            configuration.modelId,
                          );

                        if (!model) {
                          return null;
                        }

                        const price =
                          configuration.packageType ===
                          "with-polaroid"
                            ? model.withPolaroidPrice
                            : model.caseOnlyPrice;

                        return (
                          <div
                            key={
                              configuration.id
                            }
                            className="flex items-start justify-between gap-3 border-b border-dashed border-ink/20 pb-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-ink">
                                {model.name}
                              </p>

                              <p className="mt-1 text-[10px] text-ink/50">
                                {configuration.packageType ===
                                "with-polaroid"
                                  ? "Polaroid + Case"
                                  : "Case Only"}
                              </p>

                              {!isConfigurationComplete(
                                configuration,
                              ) && (
                                <p className="mt-1 text-[9px] font-bold text-burgundy">
                                  Needs a photo
                                </p>
                              )}
                            </div>

                            <span className="shrink-0 text-xs font-bold text-burgundy">
                              {formatPrice(
                                price,
                              )}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs font-semibold text-ink/55">
                    <span>
                      Configured
                    </span>

                    <span>
                      {
                        completedConfigurations
                      }
                      /
                      {
                        configurations.length
                      }
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t-2 border-ink pt-4">
                    <span className="font-serif text-lg font-semibold">
                      Total
                    </span>

                    <span className="font-serif text-2xl font-bold text-burgundy">
                      {formatPrice(
                        totalPrice,
                      )}
                    </span>
                  </div>
                </>
              )}

              <button
                type="button"
                aria-busy={
                  isAddingToCart
                }
                disabled={
                  !allConfigurationsComplete ||
                  isAddingToCart
                }
                onClick={
                  handleAddToCart
                }
                className="mt-5 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAddingToCart
                  ? editItemId
                    ? "Saving Changes…"
                    : "Preparing Your Cases…"
                  : configurations.length ===
                      0
                    ? "Choose a Phone Model"
                    : !allConfigurationsComplete
                      ? `Configure ${
                          configurations.length -
                          completedConfigurations
                        } Remaining`
                      : editItemId
                        ? `Save Changes — ${formatPrice(
                            totalPrice,
                          )}`
                        : `Add ${
                            configurations.length
                          } ${
                            configurations.length ===
                            1
                              ? "Case"
                              : "Cases"
                          } — ${formatPrice(
                            totalPrice,
                          )}`}
              </button>
            </div>
          </aside>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </section>

      {configurations.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-cream px-4 py-3 lg:hidden">
          <div className="min-w-0 shrink-0">
            <p className="text-[10px] font-semibold text-ink/55">
              {
                configurations.length
              }{" "}
              {configurations.length === 1
                ? "case"
                : "cases"}
            </p>

            <p className="font-serif text-base font-bold text-burgundy">
              {formatPrice(totalPrice)}
            </p>
          </div>

          <button
            type="button"
            aria-busy={
              isAddingToCart
            }
            disabled={
              !allConfigurationsComplete ||
              isAddingToCart
            }
            onClick={handleAddToCart}
            className="flex flex-1 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAddingToCart
              ? editItemId
                ? "Saving…"
                : "Preparing…"
              : !allConfigurationsComplete
                ? `Configure ${
                    configurations.length -
                    completedConfigurations
                  } Remaining`
                : editItemId
                  ? "Save Changes"
                  : "Add to Cart"}
          </button>
        </div>
      )}

      {editingConfiguration &&
        editingPhoto && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit Polaroid position"
            className="fixed inset-0 z-[90] flex flex-col bg-cream lg:items-center lg:justify-center lg:bg-ink/50 lg:p-6"
          >
            <button
              type="button"
              aria-label="Close photo editor"
              onClick={
                closePhotoEditor
              }
              className="absolute inset-0 hidden lg:block"
            />

            <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-cream lg:h-auto lg:max-h-[92vh] lg:max-w-[980px] lg:rounded-[22px] lg:border-2 lg:border-ink lg:shadow-[10px_10px_0_#2A211C]">
              <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={
                    closePhotoEditor
                  }
                  className="flex items-center gap-2 text-sm font-bold"
                >
                  <LuArrowLeft className="h-5 w-5 lg:hidden" />

                  <LuX className="hidden h-5 w-5 lg:block" />

                  Back
                </button>

                <p className="text-xs font-bold text-ink/55 sm:text-sm">
                  Edit photo position
                </p>

                <button
                  type="button"
                  onClick={
                    closePhotoEditor
                  }
                  className="rounded-full bg-burgundy px-3 py-2 text-xs font-bold text-cream sm:px-4"
                >
                  Done
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:overflow-hidden">
                <div className="flex min-h-[420px] items-center justify-center bg-blush p-5 sm:min-h-[550px] sm:p-8 lg:min-h-[620px]">
                  <PhoneCaseMockup
                    modelName={
                      modelMap.get(
                        editingConfiguration.modelId,
                      )?.name ??
                      "iPhone"
                    }
                    packageType={
                      editingConfiguration.packageType
                    }
                    photo={
                      editingPhoto
                    }
                    configuration={
                      editingConfiguration
                    }
                    editable
                    onChange={(
                      updates,
                    ) =>
                      updateConfiguration(
                        editingConfiguration.id,
                        updates,
                      )
                    }
                    className="max-w-[210px] sm:max-w-[275px]"
                  />
                </div>

                <div className="bg-paper p-5 sm:p-7 lg:overflow-y-auto lg:p-8">
                  <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold shadow-[2px_2px_0_#2A211C]">
                    make it yours ✦
                  </span>

                  <h2 className="mt-4 font-serif text-2xl font-semibold">
                    Adjust your Polaroid
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-ink/60">
                    Drag the image inside
                    the Polaroid, then adjust
                    the zoom or orientation.
                  </p>

                  <div className="mt-7">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <label htmlFor="case-photo-zoom">
                        Zoom
                      </label>

                      <span className="text-ink/50">
                        {Math.round(
                          editingConfiguration.zoom *
                            100,
                        )}
                        %
                      </span>
                    </div>

                    <input
                      id="case-photo-zoom"
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={
                        editingConfiguration.zoom
                      }
                      onChange={(
                        event,
                      ) =>
                        updateConfiguration(
                          editingConfiguration.id,
                          {
                            zoom: Number(
                              event.target
                                .value,
                            ),
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
                        {
                          editingConfiguration.rotation
                        }
                        °
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {ROTATION_OPTIONS.map(
                        (rotation) => {
                          const isSelected =
                            editingConfiguration.rotation ===
                            rotation;

                          return (
                            <button
                              key={
                                rotation
                              }
                              type="button"
                              onClick={() =>
                                updateConfiguration(
                                  editingConfiguration.id,
                                  {
                                    rotation,
                                    zoom: 1,
                                    crop: {
                                      x: 0,
                                      y: 0,
                                    },
                                    croppedAreaPixels:
                                      null,
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
                        },
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closePhotoEditor
                    }
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

      {successModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 px-4">
          <div className="w-full max-w-[460px] rounded-[22px] border-2 border-ink bg-cream p-5 text-center shadow-[8px_8px_0_#2A211C] sm:p-7">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-burgundy text-cream">
              <LuCheck className="h-6 w-6" />
            </span>

            <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
              Your phone cases are in the
              cart ✦
            </h2>

            <p className="mx-auto mt-2 max-w-[360px] text-sm leading-6 text-ink/60">
              Want to add some extra
              Polaroids to your order?
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/products/polaroids",
                  )
                }
                className="flex w-full items-center justify-center rounded-full border-2 border-ink bg-blush px-5 py-3 text-sm font-bold text-ink shadow-[3px_3px_0_#2A211C]"
              >
                Create Extra Polaroids
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/cart")
                }
                className="flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C]"
              >
                No, View Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhoneCaseCustomizer;