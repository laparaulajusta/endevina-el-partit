import { Schema, model, models } from 'mongoose';

const LegislaturaSchema = new Schema({
  numero: { type: Number, required: true, unique: true },
  nom: { type: String, required: true },
  anyInici: { type: Number, required: true },
  anyFi: { type: Number, required: true },
  partitsIds: [{ type: Schema.Types.ObjectId, ref: 'Partit' }],
});

export const Legislatura = models.Legislatura || model('Legislatura', LegislaturaSchema);