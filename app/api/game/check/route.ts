import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Video } from '@/models/Video';
import { clipPageUrl, VIDEO_BUFFER } from '@/lib/parlamentManifest';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { videoId, partitId } = await req.json();

    const video = await Video.findById(videoId).populate('partitId');
    if (!video) 
        return NextResponse.json({ error: 'Vídeo no trobat' }, { status: 404 });

    const isCorrect = video.partitId._id.toString() === partitId;

    return NextResponse.json({
      correct: isCorrect,
      orador: video.orador,
      partitCorrecte: video.partitId.nom,
      siglesCorrectes: video.partitId.sigles,
      parlamentUrl: clipPageUrl(video.idVideoFragment, video.posicio + VIDEO_BUFFER)
    });
  } catch (error) {
    console.error(`Error a l'API check:`, error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}