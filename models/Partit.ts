import { Schema, model, models } from 'mongoose';

const PartitSchema = new Schema({
  nom: { type: String, required: true },
  sigles: { type: String, required: true },
  legislaturaId: { type: Schema.Types.ObjectId, ref: 'Legislatura', required: true },
  color: { type: String, default: '#64748b' },
});

export const Partit = models.Partit || model('Partit', PartitSchema);