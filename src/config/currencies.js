/**
 * Currency configuration and preset matrix for multi-tenant church localization.
 */

export const DEFAULT_CURRENCY_CONFIG = {
  code: 'PHP',
  symbol: '₱',
  name: 'Philippine Peso',
  position: 'prefix',
  decimalPlaces: 2,
  locale: 'en-PH',
};

export const POPULAR_CURRENCIES = [
  {
    code: 'PHP',
    symbol: '₱',
    name: 'Philippine Peso',
    label: 'PHP - Philippine Peso (₱)',
    locale: 'en-PH',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'AED',
    symbol: 'AED',
    name: 'United Arab Emirates Dirham',
    label: 'AED - Arab Emirates Dirham (AED)',
    locale: 'en-AE',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    label: 'USD - US Dollar ($)',
    locale: 'en-US',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    label: 'CAD - Canadian Dollar (CA$)',
    locale: 'en-CA',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    label: 'AUD - Australian Dollar (A$)',
    locale: 'en-AU',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    label: 'GBP - British Pound (£)',
    locale: 'en-GB',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    label: 'EUR - Euro (€)',
    locale: 'de-DE',
    position: 'suffix',
    decimalPlaces: 2,
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    label: 'SGD - Singapore Dollar (S$)',
    locale: 'en-SG',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'HKD',
    symbol: 'HK$',
    name: 'Hong Kong Dollar',
    label: 'HKD - Hong Kong Dollar (HK$)',
    locale: 'zh-HK',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    label: 'NZD - New Zealand Dollar (NZ$)',
    locale: 'en-NZ',
    position: 'prefix',
    decimalPlaces: 2,
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    label: 'JPY - Japanese Yen (¥)',
    locale: 'ja-JP',
    position: 'prefix',
    decimalPlaces: 0,
  },
  {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    label: 'KRW - South Korean Won (₩)',
    locale: 'ko-KR',
    position: 'prefix',
    decimalPlaces: 0,
  },
];

export function findCurrencyByCode(code) {
  if (!code) return DEFAULT_CURRENCY_CONFIG;
  const match = POPULAR_CURRENCIES.find((c) => c.code.toUpperCase() === String(code).toUpperCase());
  return match || null;
}

export function normalizeCurrencyConfig(config) {
  if (!config || typeof config !== 'object') {
    return { ...DEFAULT_CURRENCY_CONFIG };
  }
  const matched = findCurrencyByCode(config.code);
  return {
    code: config.code || matched?.code || DEFAULT_CURRENCY_CONFIG.code,
    symbol: config.symbol || matched?.symbol || DEFAULT_CURRENCY_CONFIG.symbol,
    name: config.name || matched?.name || DEFAULT_CURRENCY_CONFIG.name,
    position: config.position || matched?.position || DEFAULT_CURRENCY_CONFIG.position,
    decimalPlaces: typeof config.decimalPlaces === 'number' ? config.decimalPlaces : (matched?.decimalPlaces ?? DEFAULT_CURRENCY_CONFIG.decimalPlaces),
    locale: config.locale || matched?.locale || DEFAULT_CURRENCY_CONFIG.locale,
  };
}
