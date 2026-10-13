import { Schema, model, models } from 'mongoose';

const VideoSchema = new Schema({
  idVideo: { type: String, required: true },
  idVideoFragment: { type: String, required: true },
  posicio: { type: Number, required: true },
  manifestUrl: { type: String },
  legislaturaId: { type: Schema.Types.ObjectId, ref: 'Legislatura', required: true },
  partitId: { type: Schema.Types.ObjectId, ref: 'Partit', required: true },
  orador: { type: String, required: true },
});

VideoSchema.index({ idVideo: 1, idVideoFragment: 1, posicio: 1 }, { unique: true });

export const Video = models.Video || model('Video', VideoSchema);