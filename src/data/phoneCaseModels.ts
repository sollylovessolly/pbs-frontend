export type PhoneCasePackage =
  | "with-polaroid"
  | "case-only";

export type PhoneCaseModel = {
  id: string;
  name: string;
  inStock: boolean;
  caseOnlyPrice: number;
  withPolaroidPrice: number;
};

export const CASE_ONLY_PRICE = 5500;
export const CASE_WITH_POLAROID_PRICE = 9000;

const createPhoneModel = (
  id: string,
  name: string,
  inStock = true,
): PhoneCaseModel => ({
  id,
  name,
  inStock,
  caseOnlyPrice: CASE_ONLY_PRICE,
  withPolaroidPrice: CASE_WITH_POLAROID_PRICE,
});

export const phoneCaseModels: PhoneCaseModel[] = [
  createPhoneModel(
    "iphone-7-8-se",
    "iPhone 7 / 8 / SE",
  ),
  createPhoneModel(
    "iphone-7-8-plus",
    "iPhone 7 Plus / 8 Plus",
  ),

  createPhoneModel(
    "iphone-x-xs",
    "iPhone X / XS",
  ),
  createPhoneModel(
    "iphone-xs-max",
    "iPhone XS Max",
  ),
  createPhoneModel(
    "iphone-xr",
    "iPhone XR",
  ),

  createPhoneModel(
    "iphone-11",
    "iPhone 11",
  ),
  createPhoneModel(
    "iphone-11-pro",
    "iPhone 11 Pro",
  ),
  createPhoneModel(
    "iphone-11-pro-max",
    "iPhone 11 Pro Max",
  ),

  createPhoneModel(
    "iphone-12-mini",
    "iPhone 12 Mini",
  ),
  createPhoneModel(
    "iphone-12",
    "iPhone 12",
  ),
  createPhoneModel(
    "iphone-12-pro",
    "iPhone 12 Pro",
  ),
  createPhoneModel(
    "iphone-12-pro-max",
    "iPhone 12 Pro Max",
  ),

  createPhoneModel(
    "iphone-13-mini",
    "iPhone 13 Mini",
  ),
  createPhoneModel(
    "iphone-13",
    "iPhone 13",
  ),
  createPhoneModel(
    "iphone-13-pro",
    "iPhone 13 Pro",
  ),
  createPhoneModel(
    "iphone-13-pro-max",
    "iPhone 13 Pro Max",
  ),

  createPhoneModel(
    "iphone-14",
    "iPhone 14",
  ),
  createPhoneModel(
    "iphone-14-plus",
    "iPhone 14 Plus",
  ),
  createPhoneModel(
    "iphone-14-pro",
    "iPhone 14 Pro",
  ),
  createPhoneModel(
    "iphone-14-pro-max",
    "iPhone 14 Pro Max",
  ),

  createPhoneModel(
    "iphone-15",
    "iPhone 15",
  ),
  createPhoneModel(
    "iphone-15-plus",
    "iPhone 15 Plus",
  ),
  createPhoneModel(
    "iphone-15-pro",
    "iPhone 15 Pro",
  ),
  createPhoneModel(
    "iphone-15-pro-max",
    "iPhone 15 Pro Max",
  ),

  createPhoneModel(
    "iphone-16e",
    "iPhone 16e",
  ),
  createPhoneModel(
    "iphone-16",
    "iPhone 16",
  ),
  createPhoneModel(
    "iphone-16-plus",
    "iPhone 16 Plus",
  ),
  createPhoneModel(
    "iphone-16-pro",
    "iPhone 16 Pro",
  ),
  createPhoneModel(
    "iphone-16-pro-max",
    "iPhone 16 Pro Max",
  ),

  createPhoneModel(
    "iphone-17",
    "iPhone 17",
  ),
  createPhoneModel(
    "iphone-17-air",
    "iPhone 17 Air",
  ),
  createPhoneModel(
    "iphone-17-pro",
    "iPhone 17 Pro",
  ),
  createPhoneModel(
    "iphone-17-pro-max",
    "iPhone 17 Pro Max",
  ),
];