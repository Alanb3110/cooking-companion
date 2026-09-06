import { installRecipeHeroImageBridge } from './recipe-hero.js';
import { installLibraryQuickFilters } from './library-filters.js';

const VALID_STATUSES = new Set(['available', 'coming_soon']);
const VALID_QUALIFICATIONS = new Set(['untested', 'test_cooked', 'validated']);

const QUALIFICATION_COPY = {
  untested: {
    badge: 'À TESTER',
    detail: 'à tester en cuisson réelle'
  },
  test_cooked: {
    badge: 'TESTÉE',
    detail: 'testée en cuisson réelle'
  },
  validated: {
    badge: 'VALIDÉE',
    detail: 'validée après retours de cuisson'
  }
};

function isLocalAssetUrl(value) {
  return typeof value === 'string' && value.startsWith('./') && !value.startsWith('./../');
}

installRecipeHeroImageBridge();

export function recipeQualification(entry) {
  if (entry?.status !== 'available') {
    return { id: null, badge: 'BIENTÔT', detail: 'non disponible' };
  }

  const id = VALID_QUALIFICATIONS.has(entry.qualification) ? entry.qualification : 'untested';
  return { id, ...QUALIFICATION_COPY[id] };
}

export function validateLibrary(library) {
  const errors = [];
  if (!library || typeof library !== 'object') return { valid: false, errors: ['Library must be an object.'] };
  if (library.schemaVersion !== 1) errors.push('Library schemaVersion must be 1.');
  if (!Array.isArray(library.recipes) || !library.recipes.length) errors.push('Library requires at least one recipe entry.');

  const ids = new Set();
  for (const entry of library.recipes || []) {
    if (!entry.id) errors.push('Every library entry requires an id.');
    else if (ids.has(entry.id)) errors.push(`Duplicate library recipe id: ${entry.id}`);
    else ids.add(entry.id);
    if (!entry.title) errors.push(`Library entry ${entry.id || '?'} requires a title.`);
    if (!VALID_STATUSES.has(entry.status)) errors.push(`Invalid status for ${entry.id || '?'}.`);
    if (entry.status === 'available' && !entry.recipeUrl) errors.push(`Available recipe ${entry.id || '?'} requires recipeUrl.`);
    if (entry.status === 'available' && !VALID_QUALIFICATIONS.has(entry.qualification)) {
      errors.push(`Available recipe ${entry.id || '?'} requires a valid qualification.`);
    }
    if (entry.qualification && !VALID_QUALIFICATIONS.has(entry.qualification)) {
      errors.push(`Invalid qualification for ${entry.id || '?'}.`);
    }

    const imageUrl = entry.visual?.imageUrl;
    if (entry.status === 'available' && !imageUrl) errors.push(`Available recipe ${entry.id || '?'} requires visual.imageUrl.`);
    if (imageUrl && !isLocalAssetUrl(imageUrl)) errors.push(`Recipe ${entry.id || '?'} visual.imageUrl must be a local relative asset URL.`);
  }

  return { valid: errors.length === 0, errors };
}

export async function loadLibrary(url = './recipes/index.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Recipe library load failed (${response.status}).`);
  const library = await response.json();
  const validation = validateLibrary(library);
  if (!validation.valid) throw new Error(`Invalid recipe library: ${validation.errors.join(' | ')}`);
  installLibraryQuickFilters(library);
  return library;
}

export function findLibraryRecipe(library, recipeId) {
  return library.recipes.find(entry => entry.id === recipeId) || null;
}
