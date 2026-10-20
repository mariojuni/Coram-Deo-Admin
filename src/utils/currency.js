import { DEFAULT_CURRENCY_CONFIG, normalizeCurrencyConfig } from '../config/currencies';

/**
 * Formats a numeric amount using the church's configured currency, locale, and position.
 *
 * @param {number|string} amount - The amount to format
 * @param {Object} [churchCurrency] - The church currency configuration object
 * @param {Object} [options] - Optional formatting overrides
 * @param {number} [options.decimals] - Override decimal places
 * @param {boolean} [options.showSymbol=true] - Whether to show the currency symbol
 * @param {boolean} [options.compact=false] - Format with abbreviations (e.g. 1.2k, 5M)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, churchCurrency = null, options = {}) {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0;
  const cfg = normalizeCurrencyConfig(churchCurrency);

  const {
    decimals = cfg.decimalPlaces,
    showSymbol = true,
    compact = false,
  } = options;

  if (compact && Math.abs(numeric) >= 1000) {
    const isNegative = numeric < 0;
    const abs = Math.abs(numeric);
    let abbreviated = '';
    let divisor = 1;
    let suffixLetter = '';

    if (abs >= 1_000_000_000) {
      divisor = 1_000_000_000;
      suffixLetter = 'B';
    } else if (abs >= 1_000_000) {
      divisor = 1_000_000;
      suffixLetter = 'M';
    } else {
      divisor = 1000;
      suffixLetter = 'k';
    }

    const value = (abs / divisor).toLocaleString(cfg.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });

    const core = `${value}${suffixLetter}`;
    const signedCore = isNegative ? `-${core}` : core;

    if (!showSymbol) return signedCore;
    return cfg.position === 'suffix'
      ? `${signedCore} ${cfg.symbol}`
      : `${cfg.symbol}${signedCore}`;
  }

  try {
    if (showSymbol) {
      return new Intl.NumberFormat(cfg.locale, {
        style: 'currency',
        currency: cfg.code,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(numeric);
    } else {
      return new Intl.NumberFormat(cfg.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(numeric);
    }
  } catch (err) {
    // Fallback format if custom symbol or older engine
    const formatted = Math.abs(numeric).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const sign = numeric < 0 ? '-' : '';

    if (!showSymbol) {
      return `${sign}${formatted}`;
    }

    if (cfg.position === 'suffix') {
      return `${sign}${formatted} ${cfg.symbol}`;
    }
    return `${sign}${cfg.symbol}${formatted}`;
  }
}

/**
 * Returns the configured currency symbol (fallback to default '₱')
 */
export function getCurrencySymbol(churchCurrency = null) {
  const cfg = normalizeCurrencyConfig(churchCurrency);
  return cfg.symbol || DEFAULT_CURRENCY_CONFIG.symbol;
}

/**
 * Returns the ISO currency code (e.g. 'AED', 'PHP', 'USD')
 */
export function getCurrencyCode(churchCurrency = null) {
  const cfg = normalizeCurrencyConfig(churchCurrency);
  return cfg.code || DEFAULT_CURRENCY_CONFIG.code;
}

/**
 * Strips or converts characters that break standard jsPDF 1-byte fonts.
 * In particular, jsPDF Type-1 Helvetica maps Unicode ₱ (U+20B1) to ± (0xB1 in WinAnsi).
 */
export function sanitizeTextForPdf(str) {
  if (!str) return '';
  return String(str).replace(/[₱\u20B1]\s*/g, 'PHP ');
}

/**
 * Formats a numeric currency amount safely for jsPDF document output,
 * preventing '₱' from rendering as '±' in PDF viewers.
 */
export function formatCurrencyForPdf(amount, churchCurrency = null, options = {}) {
  const formatted = formatCurrency(amount, churchCurrency, options);
  return sanitizeTextForPdf(formatted);
}

