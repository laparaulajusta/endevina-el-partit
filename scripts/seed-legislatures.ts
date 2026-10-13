import { connectDB } from '@/lib/mongodb';
import { Legislatura } from '@/models/Legislatura';
import { Partit } from '@/models/Partit';
import { Video } from '@/models/Video';

// Execució des de terminal: npx tsx scripts/seed-legislatures.ts

interface LegislaturaData {
  numero: number;
  nom: string;
  anyInici: number;
  anyFi: number;
  partits: { nom: string; sigles: string }[];
}

const HISTORIC_LEGISLATURES: LegislaturaData[] = [
  {
    numero: 1, nom: 'I Legislatura', anyInici: 1980, anyFi: 1984,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Partit Socialista Unificat de Catalunya', sigles: 'PSUC' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Centristes de Catalunya - UCD', sigles: 'CC-UCD' },
      { nom: 'Alianza Popular', sigles: 'AP' }
    ]
  },
  {
    numero: 2, nom: 'II Legislatura', anyInici: 1984, anyFi: 1988,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Alianza Popular', sigles: 'AP' },
      { nom: 'Partit Socialista Unificat de Catalunya', sigles: 'PSUC' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' }
    ]
  },
  {
    numero: 3, nom: 'III Legislatura', anyInici: 1988, anyFi: 1992,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Iniciativa per Catalunya', sigles: 'IC' },
      { nom: 'Alianza Popular / PP', sigles: 'AP/PPC' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Centro Democrático y Social', sigles: 'CDS' }
    ]
  },
  {
    numero: 4, nom: 'IV Legislatura', anyInici: 1992, anyFi: 1995,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Iniciativa per Catalunya', sigles: 'IC' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' }
    ]
  },
  {
    numero: 5, nom: 'V Legislatura', anyInici: 1995, anyFi: 1999,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Iniciativa per Catalunya Els Verds', sigles: 'IC-EV' }
    ]
  },
  {
    numero: 6, nom: 'VI Legislatura', anyInici: 1999, anyFi: 2003,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes - Ciutadans pel Canvi', sigles: 'PSC-CPC' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Iniciativa per Catalunya Verds', sigles: 'ICV' }
    ]
  },
  {
    numero: 7, nom: 'VII Legislatura', anyInici: 2003, anyFi: 2006,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes - Ciutadans pel Canvi', sigles: 'PSC-CPC' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Iniciativa per Catalunya Verds - Esquerra Unida', sigles: 'ICV-EUiA' }
    ]
  },
  {
    numero: 8, nom: 'VIII Legislatura', anyInici: 2006, anyFi: 2010,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Iniciativa per Catalunya Verds - EUiA', sigles: 'ICV-EUiA' },
      { nom: 'Ciutadans - Partido de la Ciudadanía', sigles: 'Cs' }
    ]
  },
  {
    numero: 9, nom: 'IX Legislatura', anyInici: 2010, anyFi: 2012,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Iniciativa per Catalunya Verds - EUiA', sigles: 'ICV-EUiA' },
      { nom: 'Subirats / Solidaritat Catalana per la Independència', sigles: 'SI' },
      { nom: 'Ciutadans - Partido de la Ciudadanía', sigles: 'Cs' }
    ]
  },
  {
    numero: 10, nom: 'X Legislatura', anyInici: 2012, anyFi: 2015,
    partits: [
      { nom: 'Convergència i Unió', sigles: 'CiU' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-PSOE' },
      { nom: 'Iniciativa per Catalunya Verds - EUiA', sigles: 'ICV-EUiA' },
      { nom: 'Ciutadans', sigles: 'Cs' },
      { nom: 'Candidatura d\'Unitat Popular', sigles: 'CUP' }
    ]
  },
  {
    numero: 11, nom: 'XI Legislatura', anyInici: 2015, anyFi: 2017,
    partits: [
      { nom: 'Junts pel Sí', sigles: 'JxSí' },
      { nom: 'Ciutadans', sigles: 'Cs' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC' },
      { nom: 'Catalunya Sí que es Pot', sigles: 'CSQP' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Candidatura d\'Unitat Popular', sigles: 'CUP' }
    ]
  },
  {
    numero: 12, nom: 'XII Legislatura', anyInici: 2018, anyFi: 2021,
    partits: [
      { nom: 'Ciutadans', sigles: 'Cs' },
      { nom: 'Junts per Catalunya', sigles: 'JxCat' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-CP' },
      { nom: 'Catalunya en Comú-Podem', sigles: 'CatECP' },
      { nom: 'Candidatura d\'Unitat Popular', sigles: 'CUP' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' }
    ]
  },
  {
    numero: 13, nom: 'XIII / XIV Legislatura', anyInici: 2021, anyFi: 2024,
    partits: [
      { nom: 'Socialistes de Catalunya', sigles: 'PSC-Units' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Junts per Catalunya', sigles: 'Junts' },
      { nom: 'Vox', sigles: 'VOX' },
      { nom: 'Candidatura d\'Unitat Popular', sigles: 'CUP-NCG' },
      { nom: 'En Comú Podem', sigles: 'ECP' },
      { nom: 'Ciutadans', sigles: 'Cs' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' }
    ]
  },
  {
    numero: 15, nom: 'XV Legislatura', anyInici: 2024, anyFi: 2028,
    partits: [
      { nom: 'Socialistes de Catalunya', sigles: 'PSC' },
      { nom: 'Junts+Carles Puigdemont per Catalunya', sigles: 'Junts' },
      { nom: 'Esquerra Republicana de Catalunya', sigles: 'ERC' },
      { nom: 'Partit Popular de Catalunya', sigles: 'PPC' },
      { nom: 'Vox', sigles: 'VOX' },
      { nom: 'Comuns Sumar', sigles: 'Comuns' },
      { nom: 'Candidatura d\'Unitat Popular', sigles: 'CUP' },
      { nom: 'Aliança Catalana', sigles: 'AC' }
    ]
  }
];

export async function seedLegislatures() {
  await connectDB();
  console.log('Netejant dades anteriors...');
  await Legislatura.deleteMany({});
  await Partit.deleteMany({});
  await Video.deleteMany({});

  for (const item of HISTORIC_LEGISLATURES) {
    const partitIds = [];

    for (const p of item.partits) {
      // Upsert: Si el partit amb aquesta sigla ja existeix, l'actualitza; si no, el crea.
      const partitDoc = await Partit.findOneAndUpdate(
        { sigles: p.sigles },
        { nom: p.nom, sigles: p.sigles },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      partitIds.push(partitDoc._id);
    }

    await Legislatura.create({
      numero: item.numero,
      nom: item.nom,
      anyInici: item.anyInici,
      anyFi: item.anyFi,
      partitsIds: partitIds
    });
  }

  console.log('✅ Base de dades sincronitzada sense duplicats i amb partits únics!');
  process.exit(0);
}

seedLegislatures().catch(err => {
  console.error('❌ Error al seed:', err);
  process.exit(1);
});