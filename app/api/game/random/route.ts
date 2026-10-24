import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Video } from '@/models/Video';
import { Partit } from '@/models/Partit';
import { resolveManifestUrl, VIDEO_BUFFER } from '@/lib/parlamentManifest';

const pickVideo = (onlyCached: boolean) =>
  Video.aggregate([
    ...(onlyCached ? [{ $match: { manifestUrl: { $exists: true, $nin: [null, ''] } } }] : []),
    { $sample: { size: 1 } },
    {
      $lookup: {
        from: 'legislaturas',
        localField: 'legislaturaId',
        foreignField: '_id',
        as: 'legislatura'
      }
    },
    { $unwind: '$legislatura' }
  ]);

const resolveAmbReintent = async (id: string | number, posicio: string | number) => {
  try {
    return await resolveManifestUrl(id, posicio, 4000);
  } catch (e: any) {
    if (e?.name === 'TimeoutError') 
      throw e;
    console.warn('Reintentant resolució del manifest:', e);
    return await resolveManifestUrl(id, posicio, 3000);
  }
};

export async function GET() {
  try {
    await connectDB();

    // 1. Triar un vídeo aleatori de la base de dades
    const randomVideos = await pickVideo(false);

    if (!randomVideos || randomVideos.length === 0)
      return NextResponse.json({ error: 'No hi ha vídeos disponibles a la base de dades' }, { status: 404 });

    let video = randomVideos[0];
    let manifestUrl: string | undefined = video.manifestUrl || undefined;

    // 2. Només anem al Parlament si no tenim el manifest guardat
    if (!manifestUrl) {
      try {
        manifestUrl = await resolveAmbReintent(video.idVideoFragment, video.posicio);
        await Video.updateOne({ _id: video._id }, { $set: { manifestUrl } });
      } catch (e) {
        console.warn("No s'ha pogut resoldre el manifest, triant un vídeo amb manifest guardat:", e);
        const fallback = await pickVideo(true);
        if (!fallback || fallback.length === 0)
          return NextResponse.json({ error: 'El servidor extern no respon' }, { status: 503 });
        video = fallback[0];
        manifestUrl = video.manifestUrl;
      }
    }

    // 3. Partits amb representació en la legislatura del vídeo finalment triat
    const legislatura = video.legislatura;
    const partits = await Partit.find({ _id: { $in: legislatura.partitsIds } });
    const effectivePosicio = (video.posicio || 0) + VIDEO_BUFFER;

    return NextResponse.json({
      videoId: video._id.toString(),
      posicio: effectivePosicio,
      manifestUrl,
      legislatura: legislatura.nom,
      partits: partits.map(p => ({
        id: p._id.toString(),
        nom: p.nom,
        sigles: p.sigles,
        color: p.color
      }))
    });
  } catch (error) {
    console.error('Error a l\'API random:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}