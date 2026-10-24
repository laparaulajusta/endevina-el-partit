const BASE = `${process.env.NEXT_PUBLIC_PARLAMENT_URL}ext/f?p=700:CLIP:0:::5:P5_ID_VIDEO_FRAGMENT,P5_POSICIO`;

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/\\u0026/gi, '&').replace(/\\u002f/gi, '/').replace(/\\\//g, '/');

export async function resolveManifestUrl(idVideoFragment: string | number, posicio: string | number = 0, timeoutMs = 10000): Promise<string> {
  const url = `${BASE}:${idVideoFragment},${posicio}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'endevina-partit/1.0', 'Accept-Language': 'ca' },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) 
    throw new Error(`CLIP ${idVideoFragment}: HTTP ${res.status}`);
  
  const html = decode(await res.text());

  const m =
    html.match(/player\.watchity\.com\/?\?[^"'\s]*?manifestArray=([^&"'\s]+\.m3u8)/i) ??
    html.match(/(https?:\/\/media\.watchity\.com\/[^"'\s<>\\]+?\.m3u8)/i);

  if (!m) {
    console.warn(`CLIP ${idVideoFragment}: sense manifest. len=${html.length} watchity=${html.includes('watchity')} m3u8=${html.includes('m3u8')}`);
    throw new Error(`CLIP ${idVideoFragment}: no s'ha trobat cap manifest al HTML`);
  }
  return /^https?%3A/i.test(m[1]) ? decodeURIComponent(m[1]) : m[1];
}

export const clipPageUrl = (idVideoFragment: string | number, posicio: string | number) =>
  `${BASE}:${idVideoFragment},${posicio}`;

export const VIDEO_BUFFER = Number(process.env.VIDEO_BUFFER ?? 30) || 0;