export function paymentPrompt(item, now = Date.now()) {
  const annual = item.subscription?.plan === 'annual';
  const remaining = Date.parse(item.subscription?.expiresAt || '') - now;
  const expired = item.state === 'expired';
  const soon = annual && item.state === 'active' && remaining > 0 && remaining <= 30 * 86400000;
  return {
    message: expired ? 'Langganan halaman telah tamat. Renew untuk mengaktifkan semula halaman.'
      : soon ? 'Tarikh tamat langganan semakin hampir. Anda boleh renew lebih awal pada pautan dan QR yang sama.' : '',
    label: expired || soon ? 'Renew halaman' : annual ? 'Renew / beli add-on' : 'Beli pakej / add-on',
  };
}
