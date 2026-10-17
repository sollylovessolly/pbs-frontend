"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuFileText,
  LuFlame,
  LuMinus,
  LuPlus,
  LuShoppingBag,
} from "react-icons/lu";

import { useProduct } from "@/component/products/shared/ProductProvider";
import {
  uploadAsset,
  loadArtwork,
  canvasesToPdf,
} from "@/lib/commerce/production";
import { useCart } from "@/context/CartContext";
import { usePackageStep } from "@/component/products/shared/PackageStepProvider";
import {
  VINTAGE_LETTER_TEMPLATES,
  type VintageLetterFinish,
  type VintageLetterTemplate,
  type VintageLetterTemplateId,
} from "@/data/vintageLetterTemplates";
import type { NewCartItem } from "@/types/cart";

type LetterSide = "front" | "back";

type LetterTextArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TemplatePreviewLayout = {
  frontTextArea: LetterTextArea;
  backTextArea: LetterTextArea;
  fontScale: number;
};

type MessageSplit = {
  frontMessage: string;
  backMessage: string;
  overflow: boolean;
  acceptedMessage: string;
};

type LetterPageProps = {
  template: VintageLetterTemplate;
  side: LetterSide;
  opening: string;
  recipient: string;
  frontMessage: string;
  backMessage: string;
  closing: string;
  sender: string;
  fontSizeScale: number;
  watermarked?: boolean;
  className?: string;
};

type GalleryItem = {
  id: string;
  templateId: VintageLetterTemplateId;
  finish: VintageLetterFinish;
  imageSrc: string;
};

const MEASUREMENT_PAGE_WIDTH = 560;

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "rusted-petals-classic",
    templateId: "rusted-petals",
    finish: "classic",
    imageSrc: "/images/vintage-letters/gallery/rusted-petals-classic.jpg",
  },
  {
    id: "rusted-petals-burnt",
    templateId: "rusted-petals",
    finish: "burnt",
    imageSrc: "/images/vintage-letters/gallery/rusted-petals-burnt.jpg",
  },
  {
    id: "timeless-ember-classic",
    templateId: "timeless-ember",
    finish: "classic",
    imageSrc: "/images/vintage-letters/gallery/timeless-ember-classic.jpg",
  },
  {
    id: "timeless-ember-burnt",
    templateId: "timeless-ember",
    finish: "burnt",
    imageSrc: "/images/vintage-letters/gallery/timeless-ember-burnt.jpg",
  },
  {
    id: "amber-classic",
    templateId: "amber",
    finish: "classic",
    imageSrc: "/images/vintage-letters/gallery/amber-classic.jpg",
  },
  {
    id: "amber-burnt",
    templateId: "amber",
    finish: "burnt",
    imageSrc: "/images/vintage-letters/gallery/amber-burnt.jpg",
  },
];

const SAMPLE_MESSAGE =
  "Some words deserve more than a screen. They deserve to be held, folded, kept and returned to years later.";

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const removeEmojis = (value: string) => {
  return value
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0F\u200D]/g, "");
};

const formatOpeningLine = (opening: string, recipient: string) => {
  const line = [opening.trim(), recipient.trim()].filter(Boolean).join(" ");

  const resolvedLine = line || "Dear your person";

  return /[,.!?;:]$/.test(resolvedLine) ? resolvedLine : `${resolvedLine},`;
};

const getTemplatePreviewLayout = (
  templateId: VintageLetterTemplateId,
): TemplatePreviewLayout => {
  switch (templateId) {
    case "rusted-petals":
      return {
        frontTextArea: {
          x: 7.5,
          y: 7.5,
          width: 81,
          height: 83,
        },
        backTextArea: {
          x: 7.5,
          y: 7.5,
          width: 81,
          height: 83,
        },
        fontScale: 0.9,
      };

    case "timeless-ember":
      return {
        frontTextArea: {
          x: 8,
          y: 7,
          width: 84,
          height: 84,
        },
        backTextArea: {
          x: 8,
          y: 7,
          width: 84,
          height: 84,
        },
        fontScale: 0.92,
      };

    case "amber":
      return {
        frontTextArea: {
          x: 7,
          y: 8,
          width: 84,
          height: 82,
        },
        backTextArea: {
          x: 7,
          y: 8,
          width: 84,
          height: 82,
        },
        fontScale: 0.88,
      };

    default:
      return {
        frontTextArea: {
          x: 9,
          y: 8,
          width: 80,
          height: 82,
        },
        backTextArea: {
          x: 9,
          y: 8,
          width: 80,
          height: 82,
        },
        fontScale: 0.9,
      };
  }
};

const getPreviewFontSize = (
  fontSize: number,
  outputWidth: number,
  templateScale: number,
  userScale: number,
) => {
  const percentage = (fontSize / outputWidth) * 150 * templateScale * userScale;

  return `${percentage}cqw`;
};

const getMeasurementFontSize = (
  fontSize: number,
  outputWidth: number,
  templateScale: number,
  userScale: number,
) => {
  return (
    (fontSize / outputWidth) *
    1.5 *
    MEASUREMENT_PAGE_WIDTH *
    templateScale *
    userScale
  );
};

const WatermarkOverlay = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 grid grid-cols-2 grid-rows-4 overflow-hidden"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <span
          key={index}
          className="flex -rotate-[28deg] items-center justify-center whitespace-nowrap px-1 text-center font-serif text-[8px] font-bold tracking-[0.12em] text-burgundy/25 sm:text-[11px]"
        >
          POLAROIDSBYSOLLY PREVIEW
        </span>
      ))}
    </div>
  );
};

const LetterPage = ({
  template,
  side,
  opening,
  recipient,
  frontMessage,
  backMessage,
  closing,
  sender,
  fontSizeScale,
  watermarked = true,
  className = "",
}: LetterPageProps) => {
  const isFront = side === "front";
  const currentMessage = isFront ? frontMessage : backMessage;

  const showEnding =
    (!backMessage && isFront) || (Boolean(backMessage) && !isFront);

  const layout = getTemplatePreviewLayout(template.id);

  const textArea = isFront ? layout.frontTextArea : layout.backTextArea;

  const artworkSrc = isFront ? template.frontSrc : template.backSrc;

  return (
    <div
      className={[
        "relative w-full overflow-hidden bg-beige shadow-[7px_9px_0_rgba(42,33,28,0.16)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        aspectRatio: `${template.outputWidth} / ${template.outputHeight}`,
        containerType: "inline-size",
      }}
    >
      <img
        src={artworkSrc}
        alt={`${template.name} ${side} letter page`}
        draggable={false}
        className="absolute inset-0 z-0 h-full w-full select-none object-fill"
      />

      <div
        className={[
          "absolute z-10 overflow-hidden whitespace-pre-wrap",
          template.fontClassName,
        ].join(" ")}
        style={{
          left: `${textArea.x}%`,
          top: `${textArea.y}%`,
          width: `${textArea.width}%`,
          height: `${textArea.height}%`,
          color: template.textColor,
          lineHeight: template.lineHeight,
        }}
      >
        {isFront && (
          <p
            style={{
              fontSize: getPreviewFontSize(
                template.recipientFontSize,
                template.outputWidth,
                layout.fontScale,
                fontSizeScale,
              ),
            }}
          >
            {formatOpeningLine(opening, recipient)}
          </p>
        )}

        <p
          className={isFront ? "mt-[2.8cqw]" : ""}
          style={{
            fontSize: getPreviewFontSize(
              template.messageFontSize,
              template.outputWidth,
              layout.fontScale,
              fontSizeScale,
            ),
          }}
        >
          {currentMessage ||
            (isFront ? "Your words will appear here as you type." : "")}
        </p>

        {showEnding && (
          <div className="mt-[2.8cqw]">
            <p
              style={{
                fontSize: getPreviewFontSize(
                  template.closingFontSize,
                  template.outputWidth,
                  layout.fontScale,
                  fontSizeScale,
                ),
              }}
            >
              {closing.trim() || "With love,"}
            </p>

            <p
              className="mt-[1cqw]"
              style={{
                fontSize: getPreviewFontSize(
                  template.senderFontSize,
                  template.outputWidth,
                  layout.fontScale,
                  fontSizeScale,
                ),
              }}
            >
              {sender.trim() || "Your name"}
            </p>
          </div>
        )}
      </div>

      {watermarked && <WatermarkOverlay />}
    </div>
  );
};

const GalleryCard = ({ item }: { item: GalleryItem }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const template =
    VINTAGE_LETTER_TEMPLATES.find(
      (currentTemplate) => currentTemplate.id === item.templateId,
    ) ?? VINTAGE_LETTER_TEMPLATES[0];

  const finishLabel = item.finish === "burnt" ? "Burnt Edge" : "Classic Edge";

  return (
    <article className="overflow-hidden rounded-[16px] border-2 border-ink bg-paper shadow-[4px_4px_0_#2A211C]">
      <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-blush p-4 sm:min-h-[360px] sm:p-6">
        {!imageFailed ? (
          <>
            <img
              src={item.imageSrc}
              alt={`${template.name} with ${finishLabel.toLowerCase()}`}
              onError={() => setImageFailed(true)}
              className="h-full max-h-[420px] w-full object-cover"
            />

            <WatermarkOverlay />
          </>
        ) : (
          <LetterPage
            template={template}
            side="front"
            opening="Dear"
            recipient="Someone Special"
            frontMessage={SAMPLE_MESSAGE}
            backMessage=""
            closing="Always yours,"
            sender="Solly"
            fontSizeScale={1}
            className="max-w-[180px] sm:max-w-[230px]"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-bold text-ink sm:text-sm">
            {template.name}
          </h3>

          <p className="mt-1 text-[10px] font-semibold text-ink/50 sm:text-xs">
            {finishLabel}
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border-2 border-ink px-2.5 py-1 text-[9px] font-bold sm:text-[10px]",
            item.finish === "burnt"
              ? "bg-burgundy text-cream"
              : "bg-beige text-ink",
          ].join(" ")}
        >
          {finishLabel}
        </span>
      </div>
    </article>
  );
};

const VintageLetterCustomizer = () => {
  const router = useRouter();
  const submissionLock = useRef(false);
  const packageStep = usePackageStep();
  const { addItems } = useCart();
  const { variant, products, selectVariant } = useProduct();

  const measurementPageRef = useRef<HTMLDivElement>(null);
  const measurementContentRef = useRef<HTMLDivElement>(null);
  const measurementRecipientRef = useRef<HTMLParagraphElement>(null);
  const measurementMessageRef = useRef<HTMLParagraphElement>(null);
  const measurementEndingRef = useRef<HTMLDivElement>(null);
  const measurementClosingRef = useRef<HTMLParagraphElement>(null);
  const measurementSenderRef = useRef<HTMLParagraphElement>(null);

  // These stable SKUs were confirmed against the deployed catalogue.
  const selectedTemplateId = (
    variant.sku.includes("RUSTED-PETALS")
      ? "rusted-petals"
      : variant.sku.includes("TIMELESS-EMBER")
        ? "timeless-ember"
        : "amber"
  ) as VintageLetterTemplateId;
  const finish: VintageLetterFinish = variant.sku.endsWith("-BURNT")
    ? "burnt"
    : "classic";
  const selectDesign = (
    template: VintageLetterTemplateId,
    edge: VintageLetterFinish,
  ) => {
    const sku = `VINTAGE-${template.toUpperCase()}-${edge === "burnt" ? "BURNT" : "NORMAL"}`;
    const match = products
      .flatMap((p) => p.variants)
      .find((v) => v.sku === sku && v.isActive);
    if (match) selectVariant(match.sku);
  };
  const setSelectedTemplateId = (id: VintageLetterTemplateId) =>
    selectDesign(id, finish);
  const setFinish = (edge: VintageLetterFinish) =>
    selectDesign(selectedTemplateId, edge);
  const [activeSide, setActiveSide] = useState<LetterSide>("front");

  const [opening, setOpening] = useState("Dear");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [closing, setClosing] = useState("With love,");
  const [sender, setSender] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [fontSizeLimitReached, setFontSizeLimitReached] = useState(false);
  const [messageSplit, setMessageSplit] = useState<MessageSplit>({
    frontMessage: "",
    backMessage: "",
    overflow: false,
    acceptedMessage: "",
  });
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const draftLoaded = useRef(false);
  useEffect(() => {
    let draft: Record<string, unknown> | null = null;
    try {
      draft = JSON.parse(sessionStorage.getItem("pbs-letter-draft") || "null");
    } catch {
      /* A draft is optional. */
    }
    queueMicrotask(() => {
      if (draft) {
        if (typeof draft.opening === "string") setOpening(draft.opening);
        if (typeof draft.recipient === "string") setRecipient(draft.recipient);
        if (typeof draft.message === "string") setMessage(draft.message);
        if (typeof draft.closing === "string") setClosing(draft.closing);
        if (typeof draft.sender === "string") setSender(draft.sender);
      }
      draftLoaded.current = true;
    });
  }, []);
  useEffect(() => {
    if (!draftLoaded.current) return;
    try {
      sessionStorage.setItem(
        "pbs-letter-draft",
        JSON.stringify({ opening, recipient, message, closing, sender }),
      );
    } catch {
      /* Continue editing when browser storage is full. */
    }
  }, [opening, recipient, message, closing, sender]);

  const selectedTemplate = useMemo(() => {
    return (
      VINTAGE_LETTER_TEMPLATES.find(
        (template) => template.id === selectedTemplateId,
      ) ?? VINTAGE_LETTER_TEMPLATES[0]
    );
  }, [selectedTemplateId]);

  const previewLayout = useMemo(() => {
    return getTemplatePreviewLayout(selectedTemplate.id);
  }, [selectedTemplate.id]);

  const prepareMeasurementPage = useCallback(
    (isFront: boolean, showEnding: boolean, value: string, scale: number) => {
      const page = measurementPageRef.current;
      const content = measurementContentRef.current;
      const recipientElement = measurementRecipientRef.current;
      const messageElement = measurementMessageRef.current;
      const endingElement = measurementEndingRef.current;
      const closingElement = measurementClosingRef.current;
      const senderElement = measurementSenderRef.current;

      if (
        !page ||
        !content ||
        !recipientElement ||
        !messageElement ||
        !endingElement ||
        !closingElement ||
        !senderElement
      ) {
        return null;
      }

      const textArea = isFront
        ? previewLayout.frontTextArea
        : previewLayout.backTextArea;

      page.style.width = `${MEASUREMENT_PAGE_WIDTH}px`;
      page.style.aspectRatio = `${selectedTemplate.outputWidth} / ${selectedTemplate.outputHeight}`;

      content.style.left = `${textArea.x}%`;
      content.style.top = `${textArea.y}%`;
      content.style.width = `${textArea.width}%`;
      content.style.height = `${textArea.height}%`;
      content.style.lineHeight = String(selectedTemplate.lineHeight);
      content.style.color = selectedTemplate.textColor;

      recipientElement.style.display = isFront ? "block" : "none";
      recipientElement.textContent = formatOpeningLine(opening, recipient);
      recipientElement.style.fontSize = `${getMeasurementFontSize(
        selectedTemplate.recipientFontSize,
        selectedTemplate.outputWidth,
        previewLayout.fontScale,
        scale,
      )}px`;

      messageElement.textContent = value;
      messageElement.style.marginTop = isFront
        ? `${MEASUREMENT_PAGE_WIDTH * 0.028}px`
        : "0px";
      messageElement.style.fontSize = `${getMeasurementFontSize(
        selectedTemplate.messageFontSize,
        selectedTemplate.outputWidth,
        previewLayout.fontScale,
        scale,
      )}px`;

      endingElement.style.display = showEnding ? "block" : "none";
      endingElement.style.marginTop = `${MEASUREMENT_PAGE_WIDTH * 0.028}px`;

      closingElement.textContent = closing.trim() || "With love,";
      closingElement.style.fontSize = `${getMeasurementFontSize(
        selectedTemplate.closingFontSize,
        selectedTemplate.outputWidth,
        previewLayout.fontScale,
        scale,
      )}px`;

      senderElement.textContent = sender.trim() || "Your name";
      senderElement.style.marginTop = `${MEASUREMENT_PAGE_WIDTH * 0.01}px`;
      senderElement.style.fontSize = `${getMeasurementFontSize(
        selectedTemplate.senderFontSize,
        selectedTemplate.outputWidth,
        previewLayout.fontScale,
        scale,
      )}px`;

      return {
        content,
      };
    },
    [closing, opening, previewLayout, recipient, selectedTemplate, sender],
  );

  const doesTextFit = useCallback(
    (value: string, isFront: boolean, showEnding: boolean, scale: number) => {
      const prepared = prepareMeasurementPage(
        isFront,
        showEnding,
        value,
        scale,
      );

      if (!prepared) return true;

      return prepared.content.scrollHeight <= prepared.content.clientHeight + 1;
    },
    [prepareMeasurementPage],
  );

  const findLargestFittingIndex = useCallback(
    (value: string, isFront: boolean, showEnding: boolean, scale: number) => {
      let low = 0;
      let high = value.length;
      let best = 0;

      while (low <= high) {
        const middle = Math.floor((low + high) / 2);

        const candidate = value.slice(0, middle);

        if (doesTextFit(candidate, isFront, showEnding, scale)) {
          best = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      if (best <= 0 || best >= value.length) {
        return best;
      }

      const readableSection = value.slice(0, best);
      const paragraphBreak = readableSection.lastIndexOf("\n");
      const wordBreak = readableSection.lastIndexOf(" ");
      const readableBreak = Math.max(paragraphBreak, wordBreak);

      return readableBreak >= Math.floor(best * 0.88) ? readableBreak : best;
    },
    [doesTextFit],
  );

  const calculateMessageSplit = useCallback(
    (rawValue: string, scale: number): MessageSplit => {
      const cleanedValue = removeEmojis(rawValue).trimEnd();

      if (!cleanedValue) {
        return {
          frontMessage: "",
          backMessage: "",
          overflow: false,
          acceptedMessage: "",
        };
      }

      if (doesTextFit(cleanedValue, true, true, scale)) {
        return {
          frontMessage: cleanedValue,
          backMessage: "",
          overflow: false,
          acceptedMessage: cleanedValue,
        };
      }

      const frontEnd = findLargestFittingIndex(
        cleanedValue,
        true,
        false,
        scale,
      );

      const frontMessage = cleanedValue.slice(0, frontEnd).trimEnd();

      let backStart = frontEnd;

      while (
        backStart < cleanedValue.length &&
        /\s/.test(cleanedValue[backStart])
      ) {
        backStart += 1;
      }

      const remainingMessage = cleanedValue.slice(backStart);

      if (doesTextFit(remainingMessage, false, true, scale)) {
        return {
          frontMessage,
          backMessage: remainingMessage,
          overflow: false,
          acceptedMessage: cleanedValue,
        };
      }

      const backEnd = findLargestFittingIndex(
        remainingMessage,
        false,
        true,
        scale,
      );

      const acceptedEnd = backStart + backEnd;
      const acceptedMessage = cleanedValue.slice(0, acceptedEnd).trimEnd();

      return {
        frontMessage,
        backMessage: cleanedValue.slice(backStart, acceptedEnd).trimEnd(),
        overflow: true,
        acceptedMessage,
      };
    },
    [doesTextFit, findLargestFittingIndex],
  );

  useLayoutEffect(() => {
    const recalculate = () => {
      setMessageSplit(calculateMessageSplit(message, fontSizeScale));
    };

    recalculate();

    void document.fonts?.ready.then(recalculate);
  }, [calculateMessageSplit, fontSizeScale, message]);

  const { frontMessage, backMessage } = messageSplit;

  const unitPrice = Number(variant.sellingPrice);

  const totalPrice = unitPrice * quantity;
  const totalPages = backMessage ? 2 : 1;

  const isComplete =
    recipient.trim().length > 0 &&
    message.trim().length > 0 &&
    closing.trim().length > 0 &&
    sender.trim().length > 0 &&
    !messageSplit.overflow;

  const updateTextValue = (
    value: string,
    setter: (newValue: string) => void,
    maxLength: number,
  ) => {
    setter(removeEmojis(value).slice(0, maxLength));
  };

  const handleMessageChange = (value: string) => {
    const cleanedValue = removeEmojis(value);
    const nextSplit = calculateMessageSplit(cleanedValue, fontSizeScale);

    setFontSizeLimitReached(false);

    if (nextSplit.overflow) {
      setMessage(nextSplit.acceptedMessage);
      setMessageSplit({
        ...nextSplit,
        overflow: false,
      });
      return;
    }

    setMessage(cleanedValue);
    setMessageSplit(nextSplit);
  };

  const handleFontSizeChange = (nextScale: number) => {
    const nextSplit = calculateMessageSplit(message, nextScale);

    if (nextSplit.overflow) {
      setFontSizeLimitReached(true);
      return;
    }

    setFontSizeLimitReached(false);
    setFontSizeScale(nextScale);
    setMessageSplit(nextSplit);
  };

  const handleAddToCart = async () => {
    if (!isComplete || isAddingToCart) return;
    if (!variant.inStock || variant.availableQuantity === 0) {
      window.alert(
        variant.reasonIfUnavailable || "This option is unavailable.",
      );
      return;
    }

    if (submissionLock.current) return;
    submissionLock.current = true;
    setIsAddingToCart(true);

    try {
      packageStep?.assertQuantity(quantity);
      await document.fonts.ready;
      const layout = getTemplatePreviewLayout(selectedTemplate.id);
      const pages: HTMLCanvasElement[] = [];
      for (const side of backMessage ? ["front", "back"] : ["front"]) {
        const canvas = document.createElement("canvas");
        canvas.width = selectedTemplate.outputWidth;
        canvas.height = selectedTemplate.outputHeight;
        const context = canvas.getContext("2d")!;
        context.drawImage(
          await loadArtwork(
            side === "front"
              ? selectedTemplate.frontSrc
              : selectedTemplate.backSrc,
          ),
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const area =
          side === "front" ? layout.frontTextArea : layout.backTextArea;
        const x = (area.x / 100) * canvas.width;
        let y = (area.y / 100) * canvas.height;
        const width = (area.width / 100) * canvas.width;
        context.fillStyle = selectedTemplate.textColor;
        context.textBaseline = "top";
        const sample = document.createElement("span");
        sample.className = selectedTemplate.fontClassName;
        document.body.append(sample);
        const family = getComputedStyle(sample).fontFamily;
        sample.remove();
        const draw = (text: string, size: number) => {
          const pixels = size * 1.5 * layout.fontScale * fontSizeScale;
          context.font = `${pixels}px ${family}`;
          for (const paragraph of text.split("\n")) {
            let line = "";
            for (const word of paragraph.split(" ")) {
              const next = line ? `${line} ${word}` : word;
              if (context.measureText(next).width > width && line) {
                context.fillText(line, x, y);
                y += pixels * selectedTemplate.lineHeight;
                line = word;
              } else line = next;
            }
            context.fillText(line, x, y);
            y += pixels * selectedTemplate.lineHeight;
          }
        };
        if (side === "front") {
          draw(
            formatOpeningLine(opening, recipient),
            selectedTemplate.recipientFontSize,
          );
          y += canvas.width * 0.028;
        }
        draw(
          side === "front" ? frontMessage : backMessage,
          selectedTemplate.messageFontSize,
        );
        if (!backMessage || side === "back") {
          y += canvas.width * 0.028;
          draw(closing, selectedTemplate.closingFontSize);
          y += canvas.width * 0.01;
          draw(sender, selectedTemplate.senderFontSize);
        }
        if (y > ((area.y + area.height) / 100) * canvas.height)
          throw new Error(
            "Your letter is too long for printing. Please reduce the text or font size.",
          );
        pages.push(canvas);
      }
      const finalPdfUrl = await uploadAsset(
        canvasesToPdf(pages),
        "VINTAGE_LETTER_FINAL",
      );
      const cartItem: NewCartItem = {
        productType: "vintage-letter",
        name: `${selectedTemplate.name} Vintage Letter`,
        unitPrice,
        variantSku: variant.sku,
        availableQuantity: variant.availableQuantity,
        customization: { finalPdfUrl },
        quantity,
        previewUrl: selectedTemplate.frontSrc,
        options: {
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          fontSize: `${Math.round(fontSizeScale * 100)}%`,
          finish,
          finishLabel:
            finish === "burnt" ? "Hand-burnt edges" : "Classic edges",
          opening: opening.trim(),
          recipient: recipient.trim(),
          openingLine: formatOpeningLine(opening, recipient),
          message: message.trim(),
          frontMessage,
          backMessage,
          closing: closing.trim(),
          sender: sender.trim(),
          pageCount: String(totalPages),
          printSides: "Front and back",
          printSize: "A4",
          customerPreview: "Watermarked",
          printExport: "Generate clean print file from order data",
        },
        turnaround: "Ready in 24–48hrs",
        editHref: "/products/vintage-letters",
        isFast: false,
      };

      if (packageStep) packageStep.saveItems([cartItem]);
      else addItems([cartItem]);
      router.push(packageStep?.returnHref ?? "/cart");
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not prepare your letter. Please retry.",
      );
    } finally {
      submissionLock.current = false;
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <section className="px-4 pb-28 pt-6 sm:px-5 md:px-7 md:pt-10 lg:pb-16 lg:pt-14">
        <div className="mx-auto max-w-[1240px]">
          <div>
            <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
              choose your paper ✦
            </span>

            <h2 className="mt-4 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Choose your letter style
            </h2>

            <p className="mt-2 max-w-[620px] text-sm leading-6 text-ink/60">
              Each design comes with its own handwriting style and can be
              finished with classic or hand-burnt edges.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-5">
            {VINTAGE_LETTER_TEMPLATES.map((template) => {
              const isSelected = selectedTemplateId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setActiveSide("front");
                    setFontSizeLimitReached(false);
                  }}
                  className={[
                    "min-w-0 rounded-[14px] border-2 p-2 text-left transition sm:rounded-[18px] sm:p-4",
                    isSelected
                      ? "border-ink bg-blush shadow-[4px_4px_0_#2A211C]"
                      : "border-ink/25 bg-paper hover:border-ink",
                  ].join(" ")}
                >
                  <div className="flex min-h-[155px] items-center justify-center overflow-hidden rounded-[10px] bg-beige p-2 sm:min-h-[260px] sm:p-5">
                    <img
                      src={template.frontSrc}
                      alt={`${template.name} blank vintage paper`}
                      draggable={false}
                      className="h-auto max-h-[230px] w-auto max-w-full object-contain shadow-[3px_4px_0_rgba(42,33,28,0.15)]"
                    />
                  </div>

                  <div className="pt-2.5 sm:pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[10px] font-bold text-ink sm:text-sm">
                          {template.name}
                        </h3>
                      </div>

                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-burgundy text-cream sm:h-6 sm:w-6">
                          <LuCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <div className="hidden lg:order-1 lg:block lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-[18px] border-2 border-ink bg-blush p-4 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-5 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-ink sm:text-sm">
                      Live preview
                    </p>

                    <p className="mt-1 text-[10px] text-ink/50 sm:text-xs">
                      Watermarked for preview only
                    </p>
                  </div>

                  <span className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-[10px] font-bold text-ink sm:text-xs">
                    Page {activeSide === "front" ? "1" : "2"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSide("front")}
                    className={[
                      "flex items-center rounded-full border-2 border-ink px-4 py-2 text-xs font-bold",
                      activeSide === "front"
                        ? "bg-burgundy text-cream"
                        : "bg-paper text-ink",
                    ].join(" ")}
                  >
                    <LuChevronLeft className="mr-1 h-4 w-4" />
                    Front
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSide("back")}
                    className={[
                      "flex items-center rounded-full border-2 border-ink px-4 py-2 text-xs font-bold",
                      activeSide === "back"
                        ? "bg-burgundy text-cream"
                        : "bg-paper text-ink",
                    ].join(" ")}
                  >
                    Back
                    <LuChevronRight className="ml-1 h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center rounded-[14px] bg-cream/70 p-3 sm:p-4">
                  <LetterPage
                    template={selectedTemplate}
                    side={activeSide}
                    opening={opening}
                    recipient={recipient}
                    frontMessage={frontMessage}
                    backMessage={backMessage}
                    closing={closing}
                    sender={sender}
                    fontSizeScale={fontSizeScale}
                    className="max-w-[245px] sm:max-w-[275px] xl:max-w-[300px]"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] font-semibold text-ink/55 sm:text-xs">
                  <span>
                    {totalPages} page{""}
                    {totalPages === 1 ? "" : "s"} used
                  </span>
                </div>
              </div>
            </div>

            <div className="order-1 rounded-[18px] border-2 border-ink bg-paper p-4 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-7 lg:order-2">
              <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-beige px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
                write from the heart
              </span>

              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                Personalise your letter
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                Your message will continue onto the back only after the
                available writing space on the front has been filled.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <label
                    htmlFor="vintage-letter-opening"
                    className="text-sm font-bold text-ink"
                  >
                    Opening
                  </label>

                  <input
                    id="vintage-letter-opening"
                    type="text"
                    value={opening}
                    maxLength={40}
                    placeholder="Dear / To / My dearest"
                    onChange={(event) =>
                      updateTextValue(event.target.value, setOpening, 40)
                    }
                    className="mt-2 w-full rounded-[12px] border-2 border-ink bg-cream px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:shadow-[3px_3px_0_#2A211C]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vintage-letter-recipient"
                    className="text-sm font-bold text-ink"
                  >
                    Recipient
                  </label>

                  <input
                    id="vintage-letter-recipient"
                    type="text"
                    value={recipient}
                    maxLength={80}
                    placeholder="e.g. Amara or my favourite person"
                    onChange={(event) =>
                      updateTextValue(event.target.value, setRecipient, 80)
                    }
                    className="mt-2 w-full rounded-[12px] border-2 border-ink bg-cream px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:shadow-[3px_3px_0_#2A211C]"
                  />
                </div>
              </div>

              <p className="mt-2 text-[10px] leading-4 text-ink/45 sm:text-xs">
                Clear the opening field to type the complete first line in the
                recipient field.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="vintage-letter-message"
                  className="text-sm font-bold text-ink"
                >
                  Your message
                </label>

                <textarea
                  id="vintage-letter-message"
                  value={message}
                  rows={12}
                  placeholder="Write your letter here..."
                  onChange={(event) => handleMessageChange(event.target.value)}
                  className="mt-2 w-full resize-none rounded-[12px] border-2 border-ink bg-cream px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-ink/35 focus:shadow-[3px_3px_0_#2A211C]"
                />

                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-semibold text-ink/45 sm:text-xs">
                  <span>Paragraph breaks will be preserved.</span>

                  <span>
                    {backMessage
                      ? "Using front and back"
                      : "Currently on the front"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="vintage-letter-closing"
                    className="text-sm font-bold text-ink"
                  >
                    Closing
                  </label>

                  <input
                    id="vintage-letter-closing"
                    type="text"
                    value={closing}
                    maxLength={60}
                    placeholder="With love,"
                    onChange={(event) =>
                      updateTextValue(event.target.value, setClosing, 60)
                    }
                    className="mt-2 w-full rounded-[12px] border-2 border-ink bg-cream px-3 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:shadow-[3px_3px_0_#2A211C]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vintage-letter-sender"
                    className="text-sm font-bold text-ink"
                  >
                    Sender
                  </label>

                  <input
                    id="vintage-letter-sender"
                    type="text"
                    value={sender}
                    maxLength={60}
                    placeholder="Your name"
                    onChange={(event) =>
                      updateTextValue(event.target.value, setSender, 60)
                    }
                    className="mt-2 w-full rounded-[12px] border-2 border-ink bg-cream px-3 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:shadow-[3px_3px_0_#2A211C]"
                  />
                </div>
              </div>

              <div className="mt-7 rounded-[18px] border-2 border-ink bg-blush p-4 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-5 lg:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-ink sm:text-sm">
                      Live preview
                    </p>

                    <p className="mt-1 text-[10px] text-ink/50 sm:text-xs">
                      Watermarked for preview only
                    </p>
                  </div>

                  <span className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-[10px] font-bold text-ink sm:text-xs">
                    Page {activeSide === "front" ? "1" : "2"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSide("front")}
                    className={[
                      "flex items-center rounded-full border-2 border-ink px-4 py-2 text-xs font-bold",
                      activeSide === "front"
                        ? "bg-burgundy text-cream"
                        : "bg-paper text-ink",
                    ].join(" ")}
                  >
                    <LuChevronLeft className="mr-1 h-4 w-4" />
                    Front
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSide("back")}
                    className={[
                      "flex items-center rounded-full border-2 border-ink px-4 py-2 text-xs font-bold",
                      activeSide === "back"
                        ? "bg-burgundy text-cream"
                        : "bg-paper text-ink",
                    ].join(" ")}
                  >
                    Back
                    <LuChevronRight className="ml-1 h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center rounded-[14px] bg-cream/70 p-3 sm:p-4">
                  <LetterPage
                    template={selectedTemplate}
                    side={activeSide}
                    opening={opening}
                    recipient={recipient}
                    frontMessage={frontMessage}
                    backMessage={backMessage}
                    closing={closing}
                    sender={sender}
                    fontSizeScale={fontSizeScale}
                    className="max-w-[245px] sm:max-w-[275px]"
                  />
                </div>

                <p className="mt-4 text-[10px] font-semibold text-ink/55 sm:text-xs">
                  {totalPages} page{totalPages === 1 ? "" : "s"} used
                </p>
              </div>

              <div className="mt-6 rounded-[14px] border-2 border-ink bg-beige/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">Writing size</p>

                    <p className="mt-1 text-[10px] leading-4 text-ink/50 sm:text-xs">
                      Short letters can use larger handwriting.
                    </p>
                  </div>

                  <span className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-xs font-bold text-burgundy">
                    {Math.round(fontSizeScale * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min={0.85}
                  max={1.25}
                  step={0.05}
                  value={fontSizeScale}
                  onChange={(event) =>
                    handleFontSizeChange(Number(event.target.value))
                  }
                  className="mt-4 w-full accent-burgundy"
                  aria-label="Letter writing size"
                />

                <div className="mt-2 flex justify-between text-[9px] font-semibold text-ink/40 sm:text-[10px]">
                  <span>Smaller</span>
                  <span>Default</span>
                  <span>Larger</span>
                </div>

                {fontSizeLimitReached && (
                  <p className="mt-3 text-[10px] font-bold leading-4 text-burgundy sm:text-xs">
                    That size would make the letter overflow both sides. Shorten
                    the message or choose a smaller size.
                  </p>
                )}
              </div>

              <div className="mt-8">
                <p className="text-sm font-bold text-ink">Choose your finish</p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFinish("classic")}
                    className={[
                      "rounded-[14px] border-2 p-3 text-left transition sm:p-4",
                      finish === "classic"
                        ? "border-ink bg-blush shadow-[3px_3px_0_#2A211C]"
                        : "border-ink/25 bg-cream hover:border-ink",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper">
                        <LuFileText className="h-4 w-4" />
                      </span>

                      {finish === "classic" && (
                        <LuCheck className="h-5 w-5 text-burgundy" />
                      )}
                    </div>

                    <p className="mt-3 text-xs font-bold text-ink sm:text-sm">
                      Classic Edge
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-ink/50 sm:text-xs">
                      Clean vintage paper edges.
                    </p>

                    <p className="mt-2 text-xs font-bold text-burgundy sm:text-sm">
                      Price shown above
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinish("burnt")}
                    className={[
                      "rounded-[14px] border-2 p-3 text-left transition sm:p-4",
                      finish === "burnt"
                        ? "border-ink bg-blush shadow-[3px_3px_0_#2A211C]"
                        : "border-ink/25 bg-cream hover:border-ink",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper">
                        <LuFlame className="h-4 w-4" />
                      </span>

                      {finish === "burnt" && (
                        <LuCheck className="h-5 w-5 text-burgundy" />
                      )}
                    </div>

                    <p className="mt-3 text-xs font-bold text-ink sm:text-sm">
                      Burnt Edge
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-ink/50 sm:text-xs">
                      Carefully aged by hand after printing.
                    </p>

                    <p className="mt-2 text-xs font-bold text-burgundy sm:text-sm">
                      Price shown above
                    </p>
                  </button>
                </div>

                <p className="mt-3 text-[10px] leading-4 text-ink/50 sm:text-xs">
                  The live preview stays clean. The gallery below shows the
                  finished burnt-edge result.
                </p>
              </div>

              <div className="mt-8 rounded-[14px] border-2 border-ink bg-beige p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-ink sm:text-sm">
                      Identical copies
                    </p>

                    <p className="mt-1 text-[10px] text-ink/50 sm:text-xs">
                      Each copy includes the front and back.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease letter quantity"
                      disabled={quantity <= 1}
                      onClick={() =>
                        setQuantity((currentQuantity) =>
                          Math.max(1, currentQuantity - 1),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper disabled:opacity-40"
                    >
                      <LuMinus className="h-4 w-4" />
                    </button>

                    <span className="min-w-5 text-center font-serif text-lg font-bold">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Increase letter quantity"
                      disabled={
                        !!packageStep && quantity >= packageStep.remaining
                      }
                      onClick={() =>
                        setQuantity((currentQuantity) =>
                          Math.min(
                            currentQuantity + 1,
                            Math.min(
                              variant.availableQuantity ?? Infinity,
                              packageStep?.remaining ?? Infinity,
                            ),
                          ),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper"
                    >
                      <LuPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-ink/25 pt-4">
                  <div>
                    <p className="text-[10px] font-semibold text-ink/50 sm:text-xs">
                      {selectedTemplate.name} ·{" "}
                      {finish === "burnt" ? "Burnt Edge" : "Classic Edge"}
                    </p>

                    <p className="mt-1 text-[10px] text-ink/45">
                      {totalPages} page {totalPages === 1 ? "side" : "sides"}{" "}
                      used · A4 · {Math.round(fontSizeScale * 100)}% writing
                    </p>
                  </div>

                  <p className="font-serif text-2xl font-bold text-burgundy">
                    {formatPrice(totalPrice)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-busy={isAddingToCart}
                disabled={
                  !isComplete ||
                  isAddingToCart ||
                  !variant.inStock ||
                  variant.availableQuantity === 0
                }
                onClick={handleAddToCart}
                className="mt-6 hidden w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-6 py-4 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
              >
                <LuShoppingBag className="mr-2 h-5 w-5" />

                {isAddingToCart
                  ? "Adding Letter…"
                  : !isComplete
                    ? "Complete Your Letter"
                    : packageStep
                      ? "Save to Package"
                      : `Add to Cart — ${formatPrice(totalPrice)}`}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-ink bg-paper px-4 py-14 sm:px-5 md:px-7 md:py-20">
        <div className="mx-auto max-w-[1240px]">
          <div className="text-center">
            <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
              made to be kept
            </span>

            <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              See how they turn out
            </h2>

            <p className="mx-auto mt-3 max-w-[620px] text-sm leading-6 text-ink/60">
              Each design is available with clean classic edges or a
              hand-finished burnt effect.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3">
            {GALLERY_ITEMS.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-cream px-4 py-3 lg:hidden">
        <div className="shrink-0">
          <p className="text-[10px] font-semibold text-ink/55">
            {quantity} {quantity === 1 ? "letter" : "letters"}
          </p>

          <p className="font-serif text-base font-bold text-burgundy">
            {formatPrice(totalPrice)}
          </p>
        </div>

        <button
          type="button"
          aria-busy={isAddingToCart}
          disabled={
            !isComplete ||
            isAddingToCart ||
            !variant.inStock ||
            variant.availableQuantity === 0
          }
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LuShoppingBag className="mr-2 h-4 w-4" />

          {isAddingToCart
            ? "Adding…"
            : !isComplete
              ? "Complete Letter"
              : packageStep
                ? "Save to Package"
                : "Add to Cart"}
        </button>
      </div>

      <div
        ref={measurementPageRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[-10000px] top-0 invisible"
      >
        <div
          ref={measurementContentRef}
          className={[
            "absolute whitespace-pre-wrap",
            selectedTemplate.fontClassName,
          ].join(" ")}
          style={{
            overflow: "visible",
          }}
        >
          <p ref={measurementRecipientRef} />

          <p ref={measurementMessageRef} />

          <div ref={measurementEndingRef}>
            <p ref={measurementClosingRef} />
            <p ref={measurementSenderRef} />
          </div>
        </div>
      </div>
    </>
  );
};

export default VintageLetterCustomizer;
