// Do not serialize page text, URLs, selectors, DOM ids, field values or error messages.
export function sensitive(el: Element): boolean {
  return !!el.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[data-private],[data-sensitive],[autocomplete="one-time-code"]');
}
export function safeWord(value: string): string | null {
  return /^[\p{L}\p{M}-]{1,24}$/u.test(value) ? value : null;
}
export function hasAccessibleName(el: Element): boolean {
  const labelled=(el.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean);
  if(labelled.some(id=>!!document.getElementById(id)?.textContent?.trim())) return true;
  if(el.getAttribute('aria-label')?.trim() || el.getAttribute('title')?.trim()) return true;
  if(el instanceof HTMLImageElement) return !!el.alt.trim();
  if(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    if(el.labels && [...el.labels].some(l=>!!l.textContent?.trim())) return true;
    if(el instanceof HTMLInputElement && ['submit','reset','button'].includes(el.type)) return el.type!=='button'||!!el.value.trim();
    return false;
  }
  return !!el.textContent?.trim() || [...el.querySelectorAll('img')].some(img=>!!img.alt.trim());
}
