export function createGoogleProvider(key) {
  async function request(path, fields, body) {
    if (!key) throw Object.assign(new Error('Carian belum diaktifkan oleh pentadbir.'), { status: 503 });
    const response = await fetch('https://places.googleapis.com/v1/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Object.assign(new Error('Carian Google tidak tersedia sekarang. Cuba sebentar lagi atau isi secara manual.'), { status: 502 });
    return response.json();
  }
  return {
    async search(query) {
      const data = await request('places:searchText', 'places.id,places.displayName,places.formattedAddress,places.businessStatus,places.attributions', {
        textQuery: query, pageSize: 5, regionCode: 'MY', languageCode: 'en',
      });
      return (data.places || []).map(p => ({ id: p.id, name: p.displayName?.text || query,
        address: p.formattedAddress || '', closed: p.businessStatus === 'CLOSED_PERMANENTLY', attributions: p.attributions || [] }));
    },
    async details(id) {
      const p = await request('places/' + encodeURIComponent(id), 'id,websiteUri');
      return { id: p.id, website: p.websiteUri || '' };
    },
  };
}
