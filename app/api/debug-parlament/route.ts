// app/api/debug-parlament/route.ts  (TEMPORAL, esborra-la després)
import { NextResponse } from 'next/server';
import { clipPageUrl } from '@/lib/parlamentManifest';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const t0 = Date.now();
  try {
    const res = await fetch(clipPageUrl(id, 0), {
      headers: { 'User-Agent': 'endevina-partit/1.0', 'Accept-Language': 'ca' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const msHeaders = Date.now() - t0;
    const html = await res.text();
    return NextResponse.json({
      status: res.status,
      msHeaders,
      msTotal: Date.now() - t0,
      len: html.length,
      watchity: html.includes('watchity'),
    });
  } catch (e: any) {
    return NextResponse.json(
      { name: e.name, message: e.message, cause: e.cause?.code ?? String(e.cause ?? ''), ms: Date.now() - t0 },
      { status: 502 }
    );
  }
}