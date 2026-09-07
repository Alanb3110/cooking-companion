import {
  LocalDataError,
  preservedDataError,
  readStorageItem,
  writeStorageItem
} from './storage.js';

export const JOURNAL_KEY = 'woodfire-companion-journal-v1';
export const JOURNAL_SCHEMA_VERSION = 2;
export const JOURNAL_BACKUP_KIND = 'woodfire-companion-journal-backup';
export const JOURNAL_BACKUP_VERSION = 1;

function safeIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeRating(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 5) return null;
  return number;
}

function normalizeNotes(value) {
  if (typeof value !== 'string') return '';
  return value.slice(0, 2000);
}

function normalizeEntry(entry) {
  return {
    ...entry,
    schemaVersion: JOURNAL_SCHEMA_VERSION,
    rating: normalizeRating(entry?.rating),
    notes: normalizeNotes(entry?.notes),
    feedbackUpdatedAt: safeIso(entry?.feedbackUpdatedAt)
  };
}

function defaultData() {
  return { schemaVersion: JOURNAL_SCHEMA_VERSION, entries: [] };
}

function migrateJournalData(parsed) {
  if (Array.isArray(parsed)) {
    return { schemaVersion: JOURNAL_SCHEMA_VERSION, entries: parsed.map(normalizeEntry) };
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
    throw new Error('Invalid journal payload.');
  }
  if (parsed.schemaVersion > JOURNAL_SCHEMA_VERSION) {
    throw new Error(`Unsupported journal schemaVersion ${parsed.schemaVersion}.`);
  }
  return {
    schemaVersion: JOURNAL_SCHEMA_VERSION,
    entries: parsed.entries.map(normalizeEntry)
  };
}

function entryFreshness(entry) {
  const timestamps = [entry?.feedbackUpdatedAt, entry?.updatedAt, entry?.servedAt]
    .map(value => safeIso(value))
    .filter(Boolean)
    .map(value => new Date(value).getTime());
  return timestamps.length ? Math.max(...timestamps) : 0;
}

function backupEntryIsValid(entry) {
  return entry
    && typeof entry === 'object'
    && !Array.isArray(entry)
    && typeof entry.id === 'string'
    && entry.id.trim().length > 0;
}

function parseJournalBackup(serialized) {
  let payload = serialized;
  if (typeof serialized === 'string') {
    try {
      payload = JSON.parse(serialized);
    } catch {
      throw new Error('Fichier JSON illisible.');
    }
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Sauvegarde de journal invalide.');
  }
  if (payload.kind !== JOURNAL_BACKUP_KIND) {
    throw new Error('Ce fichier n’est pas une sauvegarde Cooking Companion reconnue.');
  }
  if (!Number.isInteger(payload.version) || payload.version < 1 || payload.version > JOURNAL_BACKUP_VERSION) {
    throw new Error('Version de sauvegarde non prise en charge.');
  }
  if (!payload.journal || typeof payload.journal !== 'object' || Array.isArray(payload.journal)) {
    throw new Error('La sauvegarde ne contient pas de journal valide.');
  }
  if (payload.journal.schemaVersion > JOURNAL_SCHEMA_VERSION) {
    throw new Error('Cette sauvegarde utilise une version de journal plus récente que l’application.');
  }
  if (!Array.isArray(payload.journal.entries) || payload.journal.entries.some(entry => !backupEntryIsValid(entry))) {
    throw new Error('La sauvegarde contient des entrées de journal invalides.');
  }

  return payload;
}

export function createSessionId(now = new Date()) {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '');
  const random = Math.random().toString(36).slice(2, 8);
  return `cook-${stamp}-${random}`;
}

function decodeJournal(raw) {
  try {
    return migrateJournalData(JSON.parse(raw));
  } catch (error) {
    throw preservedDataError(error);
  }
}

export function readJournal(storage) {
  try {
    const raw = readStorageItem(JOURNAL_KEY, storage);
    if (!raw) return { data: defaultData(), status: 'empty', warning: null };
    return { data: decodeJournal(raw), status: 'ok', warning: null };
  } catch (error) {
    console.warn('Journal local illisible, retour à un journal vide.', error);
    const normalized = error instanceof LocalDataError ? error : preservedDataError(error);
    return {
      data: defaultData(),
      status: normalized.code,
      warning: normalized.message,
      error: normalized
    };
  }
}

export function loadJournal(storage) {
  return readJournal(storage).data;
}

function loadJournalForMutation(storage) {
  const result = readJournal(storage);
  if (result.status !== 'ok' && result.status !== 'empty') throw result.error;
  return result.data;
}

export function saveJournal(data, storage) {
  writeStorageItem(JOURNAL_KEY, JSON.stringify({
    schemaVersion: JOURNAL_SCHEMA_VERSION,
    entries: Array.isArray(data?.entries) ? data.entries.map(normalizeEntry) : []
  }), storage);
}

export function exportJournalBackup(data = loadJournal(), now = new Date()) {
  const journal = migrateJournalData(data);
  return JSON.stringify({
    kind: JOURNAL_BACKUP_KIND,
    version: JOURNAL_BACKUP_VERSION,
    exportedAt: now.toISOString(),
    journal
  }, null, 2);
}

export function importJournalBackup(serialized, storage) {
  const payload = parseJournalBackup(serialized);
  const imported = migrateJournalData(payload.journal);
  const existing = loadJournalForMutation(storage);
  const merged = new Map(existing.entries.map(entry => [entry.id, entry]));
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incoming of imported.entries) {
    if (incoming.isTest) {
      skipped += 1;
      continue;
    }
    const current = merged.get(incoming.id);
    if (!current) {
      merged.set(incoming.id, incoming);
      added += 1;
      continue;
    }

    if (entryFreshness(incoming) > entryFreshness(current)) {
      merged.set(incoming.id, incoming);
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  const data = {
    schemaVersion: JOURNAL_SCHEMA_VERSION,
    entries: [...merged.values()]
      .map(normalizeEntry)
      .sort((a, b) => entryFreshness(b) - entryFreshness(a))
  };
  saveJournal(data, storage);
  return { data, added, updated, skipped };
}

function serializeSchedule(schedule) {
  return (schedule || []).map(item => ({
    stepId: item.step.id,
    title: item.step.title,
    component: item.step.component || null,
    baselineStart: safeIso(item.baselineStart || item.start),
    baselineEnd: safeIso(item.baselineEnd || item.end),
    finalStart: safeIso(item.start),
    finalEnd: safeIso(item.end)
  }));
}

function earliestTimestamp(state, fallback) {
  const candidates = [
    state.sessionStartedAt,
    state.cookStartedAt,
    ...Object.values(state.started || {}),
    ...Object.values(state.completed || {})
  ]
    .map(value => safeIso(value))
    .filter(Boolean)
    .sort();
  return candidates[0] || fallback;
}

export function resolveServiceStep(recipe) {
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];

  if (recipe?.serviceStepId) {
    const explicit = steps.find(step => step.id === recipe.serviceStepId);
    if (!explicit) throw new Error(`serviceStepId references missing step ${recipe.serviceStepId}.`);
    return explicit;
  }

  const zeroOffsetServeAnchors = steps.filter(step =>
    step.plan?.anchor === 'serve' && (step.plan?.anchorOffsetMin ?? 0) === 0
  );

  if (zeroOffsetServeAnchors.length === 1) return zeroOffsetServeAnchors[0];
  if (!zeroOffsetServeAnchors.length) {
    throw new Error('Recipe requires serviceStepId or exactly one zero-offset serve anchor.');
  }
  throw new Error('Recipe has multiple zero-offset serve anchors; define serviceStepId explicitly.');
}

export function buildJournalEntry({ state, recipe, schedule, now = new Date() }) {
  if (!state?.sessionId) throw new Error('A sessionId is required to archive a cook.');
  if (!recipe) throw new Error('A recipe is required to archive a cook.');

  const serviceStep = resolveServiceStep(recipe);
  const servedAt = safeIso(state.completed?.[serviceStep.id]);
  if (!servedAt) throw new Error(`Service step ${serviceStep.id} must be completed before archiving.`);

  const updatedAt = now.toISOString();
  const started = { ...(state.started || {}) };
  const completed = { ...(state.completed || {}) };
  const measurements = (state.measurements || []).map(sample => ({ ...sample }));
  const observations = (state.observations || []).map(observation => ({ ...observation }));

  return {
    schemaVersion: JOURNAL_SCHEMA_VERSION,
    id: state.sessionId,
    isTest: Boolean(state.isTest),
    recipeId: recipe.id,
    recipeVersion: recipe.version,
    recipeTitle: recipe.title,
    serviceStepId: serviceStep.id,
    servings: state.servings,
    targetMealTime: state.mealTime,
    targetServingAt: safeIso(state.targetServingAt),
    sessionStartedAt: earliestTimestamp(state, servedAt),
    servedAt,
    updatedAt,
    temperatureTarget: state.temperatureTarget,
    measurements,
    observations,
    started,
    completed,
    taskShifts: { ...(state.taskShifts || {}) },
    totalSteps: recipe.steps.length,
    schedule: serializeSchedule(schedule)
  };
}

export function upsertJournalEntry(entry, storage) {
  if (entry?.isTest) return loadJournal(storage);
  const data = loadJournalForMutation(storage);
  const hasRating = Object.prototype.hasOwnProperty.call(entry || {}, 'rating');
  const hasNotes = Object.prototype.hasOwnProperty.call(entry || {}, 'notes');
  const hasFeedbackUpdatedAt = Object.prototype.hasOwnProperty.call(entry || {}, 'feedbackUpdatedAt');
  const normalized = normalizeEntry(entry);
  const index = data.entries.findIndex(item => item.id === normalized.id);

  if (index >= 0) {
    const existing = data.entries[index];
    data.entries[index] = normalizeEntry({
      ...existing,
      ...normalized,
      rating: hasRating ? normalized.rating : existing.rating,
      notes: hasNotes ? normalized.notes : existing.notes,
      feedbackUpdatedAt: hasFeedbackUpdatedAt ? normalized.feedbackUpdatedAt : existing.feedbackUpdatedAt
    });
  } else {
    data.entries.push(normalized);
  }

  data.entries.sort((a, b) => new Date(b.servedAt || b.updatedAt) - new Date(a.servedAt || a.updatedAt));
  saveJournal(data, storage);
  return data;
}

export function updateJournalFeedback(id, { rating = null, notes = '' } = {}, storage, now = new Date()) {
  if (!id) throw new Error('Journal feedback requires an entry id.');
  const normalizedRating = rating === null || rating === '' ? null : Number(rating);
  if (normalizedRating !== null && (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5)) {
    throw new Error('La note doit être comprise entre 1 et 5.');
  }
  const normalizedNotes = normalizeNotes(notes);
  const data = loadJournalForMutation(storage);
  const index = data.entries.findIndex(item => item.id === id);
  if (index < 0) throw new Error('Cuisson introuvable dans le journal.');
  data.entries[index] = normalizeEntry({
    ...data.entries[index],
    rating: normalizedRating,
    notes: normalizedNotes,
    feedbackUpdatedAt: now.toISOString()
  });
  saveJournal(data, storage);
  return data.entries[index];
}

export function removeJournalEntry(id, storage) {
  const data = loadJournalForMutation(storage);
  data.entries = data.entries.filter(item => item.id !== id);
  saveJournal(data, storage);
  return data;
}

export function clearJournal(storage) {
  loadJournalForMutation(storage);
  const data = defaultData();
  saveJournal(data, storage);
  return data;
}
