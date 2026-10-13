import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Video } from '@/models/Video';
import { Partit } from '@/models/Partit';
import { resolveManifestUrl, VIDEO_BUFFER } from '@/lib/parlamentManifest';

export async function GET() {
  try {
    await connectDB();
    
    // 1. Triar un vídeo aleatori de la base de dades
    const randomVideos = await Video.aggregate([
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

    if (!randomVideos || randomVideos.length === 0)
      return NextResponse.json({ error: 'No hi ha vídeos disponibles a la base de dades' }, { status: 404 });

    const video = randomVideos[0];
    const legislatura = video.legislatura;

    // 2. Obtenir només els partits amb representació en aquella legislatura concreta
    const partits = await Partit.find({ _id: { $in: legislatura.partitsIds } });

    // 3. Enviar dades al frontend (sense revelar el partit ni l'orador!)
    const effectivePosicio = (video.posicio || 0) + VIDEO_BUFFER;

    let manifestUrl = video.manifestUrl;
    if (!manifestUrl) {
      manifestUrl = await resolveManifestUrl(video.idVideoFragment, video.posicio);
      await Video.updateOne({ _id: video._id }, { $set: { manifestUrl } });
    }

    return NextResponse.json({
      videoId: video._id.toString(),
      posicio: effectivePosicio,
      manifestUrl: manifestUrl,
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