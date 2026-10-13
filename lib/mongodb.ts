import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carrega les variables del fitxer .env.local tant a la web com als scripts de terminal
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI)
  throw new Error('Cal definir la variable MONGODB_URI al fitxer .env.local');

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) 
    return;
  try {
    await mongoose.connect(MONGODB_URI || '');
    console.log('Connectat correctament a MongoDB');
  } catch (error) {
    console.error('Error de connexió a MongoDB:', error);
    throw error;
  }
}