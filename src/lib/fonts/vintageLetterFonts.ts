import {
  Alex_Brush,
  Beth_Ellen,
  Cedarville_Cursive,
} from "next/font/google";

export const rustedPetalsFont =
  Cedarville_Cursive({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-rusted-petals",
  });

export const timelessEmberFont =
  Alex_Brush({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-timeless-ember",
  });

export const amberFont = Beth_Ellen({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-amber",
});

export const vintageLetterFontVariables = [
  rustedPetalsFont.variable,
  timelessEmberFont.variable,
  amberFont.variable,
].join(" ");