const parseLegacyGrams = (label) => {
  const value = String(label).trim().toLowerCase().replaceAll(" ", "");
  if (value.endsWith("kg")) {
    return Math.round(Number.parseFloat(value.slice(0, -2)) * 1000);
  }
  return Math.round(Number.parseFloat(value.replace(/(grams?|qram|gr|qr|g)$/u, "")));
};

export const getPriceOptions = (product) => {
  const options = Array.isArray(product?.price_options)
    ? product.price_options
    : Object.entries(product?.prices || {}).map(([label, price]) => ({
        grams: parseLegacyGrams(label),
        price: Number(price),
      }));

  return options
    .map((option) => ({
      grams: Number(option.grams),
      price: Number(option.price),
    }))
    .filter(
      (option) =>
        Number.isFinite(option.grams) &&
        option.grams > 0 &&
        Number.isFinite(option.price) &&
        option.price >= 0,
    )
    .sort((a, b) => a.grams - b.grams);
};

export const formatGrams = (grams) => `${Number(grams)} q`;

export const formatPrice = (price) =>
  new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: Number(price) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(price));

export const getCategoryName = (product) =>
  product?.category?.name || "Kateqoriyasız";

export const withSelectedPrice = (product, selectedGrams) => {
  const priceOptions = getPriceOptions(product);
  const selected =
    priceOptions.find((option) => option.grams === Number(selectedGrams)) ||
    priceOptions[0];

  return {
    ...product,
    priceOptions,
    selectedGrams: selected?.grams,
    price: selected?.price,
  };
};
