import { ref } from 'vue';

import { useSettings } from './useSettings';
const { configs } = useSettings();

// Global reactive state for user preferences
export const currentCurrency = ref(configs.userDefaultCurrency);
export const currentUnit = ref(configs.userDefaultAreaUnit);

// Approximate exchange rates relative to PHP (1 PHP = X Foreign Currency)
const exchangeRates: Record<string, number> = {
  'PHP': 1,
  'USD': 0.017,
  'CAD': 0.023,
  'CNY': 0.123,
  'JPY': 2.65
};

export const currencySymbols: Record<string, string> = {
  'PHP': '₱',
  'USD': '$',
  'CAD': 'CA$',
  'CNY': '¥',
  'JPY': '¥'
};

export const SQM_TO_SQFT = 10.7639;

export const areaUnits: Record<string, string> = {
  'Metric': 'sqm',
  'English': 'sqft'
}

// --- Display Formatters (For Reading) ---
export const convertPrice = (priceInPHP: number) => {
  const rate = exchangeRates[currentCurrency.value] || 1;
  return priceInPHP * rate;
};

export const formatPrice = (priceInPHP: number) => {
  const converted = convertPrice(priceInPHP);
  const symbol = currencySymbols[currentCurrency.value] || '₱';
  return `${symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const convertArea = (areaInSqm: number) => {
  if (currentUnit.value === 'English') {
    return areaInSqm * SQM_TO_SQFT;
  }
  return areaInSqm;
};

export const formatArea = (areaInSqm: number) => {
  const converted = convertArea(areaInSqm);
  const unitLabel = currentUnit.value === 'English' ? 'sqft' : 'sqm';
  return `${converted.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unitLabel}`;
};

// --- Form Converters (For Saving to Database) ---
export const convertPriceToPHP = (displayedPrice: number) => {
  const rate = exchangeRates[currentCurrency.value] || 1;
  return displayedPrice / rate;
};

export const convertAreaToSqm = (displayedArea: number) => {
  if (currentUnit.value === 'English') {
    return displayedArea / SQM_TO_SQFT;
  }
  return displayedArea;
};