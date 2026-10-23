export function createGoogleProvider(key, { fetcher = fetch } = {}) {
  async function request(path, fields, body) {
    if (!key) throw Object.assign(new Error('Carian belum diaktifkan oleh pentadbir.'), { status: 503 });
    const response = await fetcher('https://places.googleapis.com/v1/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Object.assign(new Error('Carian Google tidak tersedia sekarang. Cuba sebentar lagi atau isi secara manual.'), { status: 502 });
    return response.json();
  }
  return {
    async suggest(query, sessionToken) {
      const data = await request('places:autocomplete', 'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text,suggestions.placePrediction.types', {
        input: query, sessionToken, regionCode:'MY', languageCode:'en', includeQueryPredictions:false,
      });
      return (data.suggestions || []).map(s => s.placePrediction).filter(p => p?.placeId &&
        p.types?.some(type => type === 'establishment' || type === 'point_of_interest')).slice(0,5).map(p => ({
          id:p.placeId, name:p.structuredFormat?.mainText?.text || p.text?.text || query,
          address:p.structuredFormat?.secondaryText?.text || '', attributions:[],
        }));
    },
    async search(query) {
      const data = await request('places:searchText', 'places.id,places.displayName,places.formattedAddress,places.businessStatus,places.attributions', {
        textQuery: query, pageSize: 5, regionCode: 'MY', languageCode: 'en',
      });
      return (data.places || []).map(p => ({ id: p.id, name: p.displayName?.text || query,
        address: p.formattedAddress || '', closed: p.businessStatus === 'CLOSED_PERMANENTLY', attributions: p.attributions || [] }));
    },
    async details(id, sessionToken) {
      const suffix = sessionToken ? '?sessionToken=' + encodeURIComponent(sessionToken) : '';
      const p = await request('places/' + encodeURIComponent(id) + suffix, 'id,websiteUri,displayName,formattedAddress,internationalPhoneNumber,nationalPhoneNumber');
      return { id: p.id, website: p.websiteUri || '', name:p.displayName?.text || '', address:p.formattedAddress || '', phone:p.internationalPhoneNumber || p.nationalPhoneNumber || '' };
    },
  };
}
