const TESTED_QUALIFICATIONS = new Set(['test_cooked', 'validated']);

function normalizedTags(entry) {
  return (entry?.tags || []).map(tag => String(tag).trim().toLocaleLowerCase('fr-FR'));
}

function elapsedMax(entry) {
  return Array.isArray(entry?.elapsedRangeMin) ? Number(entry.elapsedRangeMin[1]) : Number.POSITIVE_INFINITY;
}

export const LIBRARY_QUICK_FILTERS = [
  {
    id: 'all',
    label: 'Toutes',
    detail: 'toute la bibliothèque',
    matches: () => true
  },
  {
    id: 'weeknight',
    label: 'Semaine',
    detail: '≤ 60 min au total · ≤ 30 min actives',
    matches: entry => entry?.status === 'available'
      && Number(entry.activePrepMin) <= 30
      && elapsedMax(entry) <= 60
  },
  {
    id: 'overnight',
    label: 'Prépa J-1',
    detail: 'préparation ou marinade en avance',
    matches: entry => {
      const tags = normalizedTags(entry);
      return entry?.status === 'available' && tags.some(tag => tag.includes('prépa la veille') || tag.includes('prépa en avance'));
    }
  },
  {
    id: 'long',
    label: 'Cuisson longue',
    detail: 'repas dont la plage de cuisson atteint au moins 3 h',
    matches: entry => entry?.status === 'available' && elapsedMax(entry) >= 180
  },
  {
    id: 'smoked',
    label: 'Fumé',
    detail: 'recettes avec une vraie phase de fumage',
    matches: entry => entry?.status === 'available'
      && (normalizedTags(entry).includes('fumé') || String(entry.visual?.eyebrow || '').toUpperCase().includes('SMOKER'))
  },
  {
    id: 'tested',
    label: 'Testées',
    detail: 'déjà cuisinées en conditions réelles',
    matches: entry => entry?.status === 'available' && TESTED_QUALIFICATIONS.has(entry.qualification)
  }
];

export function libraryQuickFilter(filterId) {
  return LIBRARY_QUICK_FILTERS.find(filter => filter.id === filterId) || LIBRARY_QUICK_FILTERS[0];
}

export function matchesLibraryQuickFilter(entry, filterId = 'all') {
  return libraryQuickFilter(filterId).matches(entry);
}

export function filterLibraryEntries(entries, filterId = 'all') {
  return (entries || []).filter(entry => matchesLibraryQuickFilter(entry, filterId));
}

function ensureFilterStylesheet() {
  if (document.querySelector('link[data-library-filters]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './library-filters.css';
  link.dataset.libraryFilters = 'true';
  document.head.appendChild(link);
}

let teardownInstalledFilters = null;

export function installLibraryQuickFilters(library, { gridId = 'recipeGrid' } = {}) {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => {};
  const grid = document.getElementById(gridId);
  if (!grid || !Array.isArray(library?.recipes)) return () => {};

  teardownInstalledFilters?.();
  ensureFilterStylesheet();

  let activeFilterId = 'all';
  const shell = document.createElement('section');
  shell.className = 'library-filter-shell';
  shell.setAttribute('aria-label', 'Filtres rapides de la bibliothèque');

  const controls = document.createElement('div');
  controls.className = 'library-filters';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Filtrer les recettes');

  const summary = document.createElement('p');
  summary.className = 'library-filter-summary';
  summary.setAttribute('aria-live', 'polite');
  shell.append(controls, summary);
  grid.before(shell);

  function applyFilter() {
    const entries = library.recipes;
    const cards = Array.from(grid.children);
    cards.forEach((card, index) => {
      const entry = entries[index];
      if (!entry) return;
      card.dataset.recipeId = entry.id;
      card.hidden = !matchesLibraryQuickFilter(entry, activeFilterId);
    });

    const filter = libraryQuickFilter(activeFilterId);
    const count = filterLibraryEntries(entries, activeFilterId).length;
    summary.textContent = `${count} recette${count === 1 ? '' : 's'} · ${filter.detail}`;
  }

  function renderControls() {
    controls.innerHTML = '';
    for (const filter of LIBRARY_QUICK_FILTERS) {
      const count = filterLibraryEntries(library.recipes, filter.id).length;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'library-filter-chip';
      button.dataset.filterId = filter.id;
      button.setAttribute('aria-pressed', String(filter.id === activeFilterId));
      button.textContent = `${filter.label} · ${count}`;
      button.addEventListener('click', () => {
        activeFilterId = filter.id;
        renderControls();
        applyFilter();
        controls.querySelector(`[data-filter-id="${filter.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      controls.appendChild(button);
    }
  }

  const observer = new MutationObserver(() => applyFilter());
  observer.observe(grid, { childList: true });
  renderControls();
  applyFilter();
  queueMicrotask(applyFilter);

  teardownInstalledFilters = () => {
    observer.disconnect();
    shell.remove();
    teardownInstalledFilters = null;
  };
  return teardownInstalledFilters;
}
