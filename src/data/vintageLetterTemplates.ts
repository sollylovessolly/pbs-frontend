import {
  amberFont,
  rustedPetalsFont,
  timelessEmberFont,
} from "@/lib/fonts/vintageLetterFonts";

export const VINTAGE_LETTER_CLASSIC_PRICE = 3500;
export const VINTAGE_LETTER_BURNT_PRICE = 4000;

export const A4_OUTPUT_WIDTH = 2480;
export const A4_OUTPUT_HEIGHT = 3508;

export type VintageLetterFinish = "classic" | "burnt";

export type VintageLetterTemplateId =
  | "rusted-petals"
  | "timeless-ember"
  | "amber";

export type LetterPageTextArea = {
  /**
   * All values are percentages of the template dimensions.
   * This keeps the layout responsive while still mapping cleanly
   * to the final A4 export canvas.
   */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VintageLetterTemplate = {
  id: VintageLetterTemplateId;
  name: string;
  description: string;

  /**
   * The same blank artwork is currently used for the front and back.
   * Separate back designs can be added later without changing the editor.
   */
  frontSrc: string;
  backSrc: string;

  sourceWidth: number;
  sourceHeight: number;

  outputWidth: number;
  outputHeight: number;

  fontName: string;
  fontClassName: string;
  canvasFontFamily: string;

  textColor: string;
  previewBackgroundColor: string;

  /**
   * Text sizes are based on the final 2480 × 3508 A4 canvas.
   */
  recipientFontSize: number;
  messageFontSize: number;
  closingFontSize: number;
  senderFontSize: number;
  lineHeight: number;

  frontTextArea: LetterPageTextArea;
  backTextArea: LetterPageTextArea;

  maxCharacters: number;

  classicPrice: number;
  burntPrice: number;
};

export const VINTAGE_LETTER_TEMPLATES: VintageLetterTemplate[] = [
  {
    id: "rusted-petals",
    name: "Rusted Petals",
    description:
      "An ornate brown parchment with dramatic Victorian flourishes.",

    frontSrc:
      "/images/vintage-letters/templates/rusted-petals.svg",
    backSrc:
      "/images/vintage-letters/templates/rusted-petals.svg",

    sourceWidth: 595.5,
    sourceHeight: 842.249979,

    outputWidth: A4_OUTPUT_WIDTH,
    outputHeight: A4_OUTPUT_HEIGHT,

    fontName: "Cedarville Cursive",
    fontClassName: rustedPetalsFont.className,
    canvasFontFamily: '"Cedarville Cursive", cursive',

    textColor: "#2F1A12",
    previewBackgroundColor: "#9B6943",

    recipientFontSize: 78,
    messageFontSize: 58,
    closingFontSize: 62,
    senderFontSize: 66,
    lineHeight: 1.42,

    /**
     * Rusted Petals has thick artwork on the right and bottom,
     * so the usable writing area is kept towards the upper-left.
     */
    frontTextArea: {
      x: 9,
      y: 9,
      width: 70,
      height: 69,
    },

    backTextArea: {
      x: 9,
      y: 9,
      width: 70,
      height: 69,
    },

    maxCharacters: 2400,

    classicPrice: VINTAGE_LETTER_CLASSIC_PRICE,
    burntPrice: VINTAGE_LETTER_BURNT_PRICE,
  },

  {
    id: "timeless-ember",
    name: "Timeless Ember",
    description:
      "A soft peach heirloom paper with delicate corner details.",

    frontSrc:
      "/images/vintage-letters/templates/timeless-ember.svg",
    backSrc:
      "/images/vintage-letters/templates/timeless-ember.svg",

    sourceWidth: 1190.25,
    sourceHeight: 1683.749949,

    outputWidth: A4_OUTPUT_WIDTH,
    outputHeight: A4_OUTPUT_HEIGHT,

    fontName: "Alex Brush",
    fontClassName: timelessEmberFont.className,
    canvasFontFamily: '"Alex Brush", cursive',

    textColor: "#442A21",
    previewBackgroundColor: "#E5BBA2",

    recipientFontSize: 88,
    messageFontSize: 64,
    closingFontSize: 68,
    senderFontSize: 72,
    lineHeight: 1.48,

    /**
     * This design has the most open writing space,
     * with only subtle decorations around the edges.
     */
    frontTextArea: {
      x: 10,
      y: 8,
      width: 80,
      height: 82,
    },

    backTextArea: {
      x: 10,
      y: 8,
      width: 80,
      height: 82,
    },

    maxCharacters: 3200,

    classicPrice: VINTAGE_LETTER_CLASSIC_PRICE,
    burntPrice: VINTAGE_LETTER_BURNT_PRICE,
  },

  {
    id: "amber",
    name: "Amber",
    description:
      "A warm golden parchment framed with pressed floral details.",

    frontSrc: "/images/vintage-letters/templates/amber.svg",
    backSrc: "/images/vintage-letters/templates/amber.svg",

    sourceWidth: 595.5,
    sourceHeight: 842.249979,

    outputWidth: A4_OUTPUT_WIDTH,
    outputHeight: A4_OUTPUT_HEIGHT,

    fontName: "Beth Ellen",
    fontClassName: amberFont.className,
    canvasFontFamily: '"Beth Ellen", cursive',

    textColor: "#342016",
    previewBackgroundColor: "#BE8D43",

    recipientFontSize: 76,
    messageFontSize: 56,
    closingFontSize: 60,
    senderFontSize: 64,
    lineHeight: 1.44,

    /**
     * Amber has flowers in the top-right and bottom-left,
     * so the writing area avoids those corners.
     */
    frontTextArea: {
      x: 12,
      y: 11,
      width: 72,
      height: 73,
    },

    backTextArea: {
      x: 12,
      y: 11,
      width: 72,
      height: 73,
    },

    maxCharacters: 2500,

    classicPrice: VINTAGE_LETTER_CLASSIC_PRICE,
    burntPrice: VINTAGE_LETTER_BURNT_PRICE,
  },
];

export const VINTAGE_LETTER_TEMPLATE_MAP = new Map(
  VINTAGE_LETTER_TEMPLATES.map((template) => [
    template.id,
    template,
  ]),
);

export const getVintageLetterTemplate = (
  templateId: VintageLetterTemplateId,
) => {
  return (
    VINTAGE_LETTER_TEMPLATE_MAP.get(templateId) ??
    VINTAGE_LETTER_TEMPLATES[0]
  );
};

export const getVintageLetterPrice = (
  template: VintageLetterTemplate,
  finish: VintageLetterFinish,
) => {
  return finish === "burnt"
    ? template.burntPrice
    : template.classicPrice;
};