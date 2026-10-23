// Cancel stale requests and wait for a typing pause before asking the provider.
export function createSuggestions({ request, onResult, onState = () => {}, delay = 600, minLength = 3 }) {
  let timer; let controller; let revision = 0;
  const cache = new Map();
  function cancel() {
    revision++;
    clearTimeout(timer);
    controller?.abort();
    controller = undefined;
  }
  function update(raw) {
    cancel();
    const query = String(raw).normalize('NFC').trim();
    if ([...query].length < minLength) { onState('idle'); return; }
    const key = query.toLocaleLowerCase();
    if (cache.has(key)) { onResult(cache.get(key), query); return; }
    const current = revision;
    onState('waiting');
    timer = setTimeout(async () => {
      controller = new AbortController();
      const signal = controller.signal;
      onState('loading');
      try {
        const data = await request(query, signal);
        if (current !== revision) return;
        cache.set(key, data);
        if (cache.size > 12) cache.delete(cache.keys().next().value);
        onResult(data, query);
      } catch (error) {
        if (current === revision && error.name !== 'AbortError') onState('error', error);
      }
    }, delay);
  }
  return { update, cancel, reset() { cancel(); cache.clear(); } };
}
