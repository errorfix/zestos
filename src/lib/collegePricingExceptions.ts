import fs from 'fs';
import path from 'path';

export type PricingExceptionMode = 'DEFAULT' | 'ADDITIVE' | 'REPLACEMENT';

export interface CollegePricingExceptionsStore {
  [eventId: string]: PricingExceptionMode;
}

const PRICING_EXCEPTIONS_FILE = path.join(process.cwd(), '.festos_college_pricing_exceptions.json');

// In-memory runtime cache
let memoryExceptions: CollegePricingExceptionsStore | null = null;

function loadExceptionsFromDisk(): CollegePricingExceptionsStore {
  try {
    if (fs.existsSync(PRICING_EXCEPTIONS_FILE)) {
      const content = fs.readFileSync(PRICING_EXCEPTIONS_FILE, 'utf-8');
      return JSON.parse(content) as CollegePricingExceptionsStore;
    }
  } catch (err) {
    console.warn('[CollegePricingExceptions] Could not load exceptions from disk:', err);
  }
  return {};
}

function saveExceptionsToDisk(store: CollegePricingExceptionsStore): void {
  try {
    fs.writeFileSync(PRICING_EXCEPTIONS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CollegePricingExceptions] Failed to save exceptions to disk:', err);
  }
}

/**
 * Returns the active map of event ID -> pricing exception mode.
 */
export function getCollegePricingExceptions(): CollegePricingExceptionsStore {
  if (!memoryExceptions) {
    memoryExceptions = loadExceptionsFromDisk();
  }
  return memoryExceptions;
}

/**
 * Updates the pricing exception mode for a specific event.
 */
export function setCollegePricingException(eventId: string, mode: PricingExceptionMode): CollegePricingExceptionsStore {
  const current = { ...getCollegePricingExceptions() };
  if (mode === 'DEFAULT') {
    delete current[eventId];
  } else {
    current[eventId] = mode;
  }
  memoryExceptions = current;
  saveExceptionsToDisk(current);
  return current;
}

/**
 * Bulk updates pricing exceptions.
 */
export function bulkSetCollegePricingExceptions(updates: CollegePricingExceptionsStore): CollegePricingExceptionsStore {
  const current = { ...getCollegePricingExceptions() };
  for (const [eventId, mode] of Object.entries(updates)) {
    if (mode === 'DEFAULT') {
      delete current[eventId];
    } else {
      current[eventId] = mode;
    }
  }
  memoryExceptions = current;
  saveExceptionsToDisk(current);
  return current;
}
