const SHARE_TITLE = 'Cooking Companion';
const SHARE_TEXT = 'Planifie et suis un repas complet, au Woodfire, au wok ou avec tes autres équipements.';
const TOAST_DURATION_MS = 2200;

export function canonicalAppUrl(href) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.slice(0, -'index.html'.length);
  }
  return url.toString();
}

export function buildAppShareData(href) {
  return {
    title: SHARE_TITLE,
    text: SHARE_TEXT,
    url: canonicalAppUrl(href)
  };
}

async function copyText(text, navigatorRef, documentRef) {
  if (navigatorRef?.clipboard?.writeText) {
    await navigatorRef.clipboard.writeText(text);
    return;
  }

  if (!documentRef?.body || typeof documentRef.execCommand !== 'function') {
    throw new Error('Clipboard API unavailable.');
  }

  const textarea = documentRef.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  documentRef.body.appendChild(textarea);
  textarea.select();
  const copied = documentRef.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard copy failed.');
}

export async function shareApp({
  href = globalThis.location?.href,
  navigatorRef = globalThis.navigator,
  documentRef = globalThis.document
} = {}) {
  if (!href) throw new Error('A current URL is required to share the app.');
  const data = buildAppShareData(href);

  if (typeof navigatorRef?.share === 'function') {
    try {
      await navigatorRef.share(data);
      return { ok: true, method: 'native', url: data.url };
    } catch (error) {
      if (error?.name === 'AbortError') return { ok: false, method: 'cancelled', url: data.url };
      // Fall through to clipboard when native sharing is unavailable at runtime.
    }
  }

  try {
    await copyText(data.url, navigatorRef, documentRef);
    return { ok: true, method: 'clipboard', url: data.url };
  } catch {
    return { ok: false, method: 'failed', url: data.url };
  }
}

function showShareToast(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  element.classList.add('visible');
  window.clearTimeout(showShareToast.hideTimer);
  showShareToast.hideTimer = window.setTimeout(() => {
    element.classList.remove('visible');
    window.setTimeout(() => { element.hidden = true; }, 180);
  }, TOAST_DURATION_MS);
}

export function bindShareUi(documentRef = globalThis.document) {
  const button = documentRef?.getElementById('shareAppBtn');
  if (!button || button.dataset.shareBound === 'true') return;
  button.dataset.shareBound = 'true';
  const toast = documentRef.getElementById('shareToast');

  button.addEventListener('click', async () => {
    const result = await shareApp({
      href: globalThis.location?.href,
      navigatorRef: globalThis.navigator,
      documentRef
    });
    if (result.method === 'clipboard') showShareToast(toast, 'Lien de l’app copié');
    if (result.method === 'failed') showShareToast(toast, 'Impossible de partager le lien');
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bindShareUi(document), { once: true });
  } else {
    bindShareUi(document);
  }
}
