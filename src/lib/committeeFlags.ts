import fs from 'fs';
import path from 'path';
import {
  EventCategoryKey,
  ALL_EVENT_CATEGORIES,
  CommitteeMeta,
  COMMITTEE_METAS,
  CommitteeFlagsStore,
  buildDefaultFlags,
  getCommitteeBySlug,
  getCommitteeById,
} from './committeeConstants';

export * from './committeeConstants';

const FLAGS_CACHE_FILE = path.join(process.cwd(), '.festos_committee_flags.json');

// In-memory runtime cache
let memoryFlags: CommitteeFlagsStore | null = null;

function loadFlagsFromDisk(): CommitteeFlagsStore {
  try {
    if (fs.existsSync(FLAGS_CACHE_FILE)) {
      const content = fs.readFileSync(FLAGS_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure all committees and categories are populated even if disk file is partial
      const defaults = buildDefaultFlags();
      const merged: CommitteeFlagsStore = { ...defaults };
      for (const [commId, cats] of Object.entries(parsed)) {
        if (merged[commId]) {
          merged[commId] = { ...merged[commId], ...(cats as Record<EventCategoryKey, boolean>) };
        } else {
          merged[commId] = cats as Record<EventCategoryKey, boolean>;
        }
      }
      return merged;
    }
  } catch (err) {
    console.warn('[CommitteeFlags] Could not load flags from disk, using defaults:', err);
  }
  return buildDefaultFlags();
}

function saveFlagsToDisk(flags: CommitteeFlagsStore) {
  try {
    fs.writeFileSync(FLAGS_CACHE_FILE, JSON.stringify(flags, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CommitteeFlags] Failed to persist flags to disk:', err);
  }
}

/**
 * Retrieves the global committee flags mapping.
 */
export function getCommitteeFlags(): CommitteeFlagsStore {
  if (!memoryFlags) {
    memoryFlags = loadFlagsFromDisk();
  }
  return memoryFlags;
}

/**
 * Returns the list of categories currently permitted for a given committee.
 */
export function getAllowedCategoriesForCommittee(committeeId: string): EventCategoryKey[] {
  const flags = getCommitteeFlags();
  const commFlags = flags[committeeId];
  if (!commFlags) {
    // If not found in store, fallback to default
    const meta = COMMITTEE_METAS.find((c) => c.id === committeeId);
    return meta ? meta.defaultCategories : [];
  }

  return (Object.keys(commFlags) as EventCategoryKey[]).filter((cat) => commFlags[cat] === true);
}

/**
 * Updates a single category toggle for a committee.
 */
export function setCommitteeFlag(
  committeeId: string,
  category: EventCategoryKey,
  enabled: boolean
): CommitteeFlagsStore {
  const flags = getCommitteeFlags();
  if (!flags[committeeId]) {
    flags[committeeId] = buildDefaultFlags()[committeeId] || {
      'Cultural - Music': false,
      'Cultural - Dance': false,
      'Cultural - Fashion': false,
      'Cultural - Theatre': false,
      Literary: false,
      Gaming: false,
      Informalz: false,
    };
  }

  flags[committeeId][category] = enabled;
  saveFlagsToDisk(flags);
  memoryFlags = flags;
  return flags;
}

/**
 * Overwrites all committee flags in one operation.
 */
export function setAllCommitteeFlags(newFlags: CommitteeFlagsStore): CommitteeFlagsStore {
  saveFlagsToDisk(newFlags);
  memoryFlags = newFlags;
  return newFlags;
}

/**
 * Resets all committee flags back to their out-of-the-box defaults.
 */
export function resetCommitteeFlagsToDefault(): CommitteeFlagsStore {
  const defaults = buildDefaultFlags();
  saveFlagsToDisk(defaults);
  memoryFlags = defaults;
  return defaults;
}
