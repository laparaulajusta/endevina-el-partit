import { connectDB } from '@/lib/mongodb';
import { chromium } from 'playwright';
import { Legislatura } from '@/models/Legislatura';
import { Partit } from '@/models/Partit';
import { Video } from '@/models/Video';
import fs from 'fs';
import path from 'path';

// Execució des de terminal: 
//  1 vídeo -> npx tsx scripts/sync-plenari.ts 17710160 15
//  1 legislatura -> npx tsx scripts/sync-plenari.ts 15

async function getOrFetchVideoIds(legislaturaNum: string): Promise<string[]> {
  const dirPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dirPath, `video-ids-leg-${legislaturaNum}.json`);

  // Si el fitxer local ja existeix, el llegeix directament
  if (fs.existsSync(filePath)) {
    console.log(`📂 S'ha trobat el fitxer local amb els IDs: data/video-ids-leg-${legislaturaNum}.json`);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  }

  console.log(`🚀 No existeix el fitxer local. Iniciant extracció massiva d'IDs per a la legislatura ${legislaturaNum}...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const targetUrl = `${process.env.PARLAMENT_URL}ext/f?p=700:1::::::`;
  console.log(`🔍 Navegant a la pàgina principal: ${targetUrl}`);

  const idsVideos = new Set<string>();

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 1 & 5. Clicar el botó de cerca avançada
    await page.waitForSelector('#btn_cerca_avanacada', { timeout: 15000 });
    await page.click('#btn_cerca_avanacada');
    await page.waitForTimeout(1000);

    // 1 & 6. Seleccionar la legislatura al Popup LOV
    await page.waitForSelector('#P0_LEGISLATURA', { timeout: 10000 });
    await page.click('#P0_LEGISLATURA');
    const optionSelector = `li[data-id="${legislaturaNum}"]`;
    await page.click(optionSelector);
    await page.waitForTimeout(1000);

    // Clicar botó de cercar
    console.log(`🔎 Executant la cerca...`);
    const cercaBtnSelector = 'button:has-text("Cercar"), input[value="Cercar"], .ui-button:has-text("Cercar"), #b_cerca';
    await page.click(cercaBtnSelector);

    // Esperar resultats
    await page.waitForSelector('div[aria-label="Resultats de la cerca"]', { timeout: 20000 });

    let hasNextPage = true;
    let pageNum = 1;

    // 2, 3 & 4. Recórrer les pàgines de resultats (15 vídeos per pàgina)
    while (hasNextPage) {
      console.log(`📄 Analitzant la pàgina ${pageNum} de resultats...`);
      await page.waitForSelector('div[aria-label="Resultats de la cerca"] .t-MediaList-body a.t-MediaList-itemWrap', { timeout: 10000 });

      const hrefs = await page.$$eval('div[aria-label="Resultats de la cerca"] .t-MediaList-body a.t-MediaList-itemWrap', links =>
        links.map(el => el.getAttribute('href') || '')
      );

      for (const href of hrefs) {
        const match = href.match(/P15_ID_VIDEO[^:]*[:=]([^,&\s]+)/i) || href.match(/15:([^,:]+)/);
        if (match && match[1]) {
          const idVideo = match[1].trim();
          if (/^\d+$/.test(idVideo) && !idsVideos.has(idVideo)) {
            idsVideos.add(idVideo);
          }
        }
      }

      console.log(`➕ Total IDs acumulats fins ara: ${idsVideos.size}`);

      const nextButton = await page.$('a.t-Report-pagination--next, a:has-text("Següent"), a[title*="Següent"], .a-IRR-pagination-item--next:not(.is-disabled) a, span.u-Button:not(.is-disabled) + a');
      const nextDisabled = await page.$('.a-IRR-pagination-item--next.is-disabled, span.u-Button.is-disabled');

      if (nextButton && !nextDisabled) {
        try {
          await nextButton.click();
          await page.waitForTimeout(1000);
          pageNum++;
        } catch {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
    }

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(Array.from(idsVideos), null, 2), 'utf-8');
    console.log(`✅ IDs desats correctament a ${filePath}`);

    await browser.close();
    return Array.from(idsVideos);
  } catch (error) {
    console.error('❌ Error en extreure els IDs de la legislatura:', error);
    await browser.close();
    throw error;
  }
}

async function syncSingleVideo(idVideo: string, legNumero: number, legislatura: any, partitsLegislatura: any[]) {
  // Compte si en anterior càrrega s'ha quedat a mitges i no ha carregat totes les intervencions d'un vídeo
  if (await Video.exists({ idVideo, legislaturaId: legislatura._id })) { 
    console.log(`⏭️ El vídeo ${idVideo} ja està sincronitzat a la base de dades. Saltant...`);
    return;
  }

  console.log(`🚀 Sincronitzant vídeo ${idVideo} (Legislatura ${legNumero})...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const targetUrl = `${process.env.PARLAMENT_URL}ext/f?p=700:${legNumero}:0:::15:P15_ID_VIDEO:${idVideo}`;
  console.log(`🔍 Navegant a: ${targetUrl}`);
  
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Fer clic a la pestanya "Intervencions" per activar la petició AJAX de l'APEX
    console.log(`⏳ Cercant i clicant la pestanya d'intervencions...`);
    
    const tabSelector = 'a[href="#SR_regio_estrats"]';

    // Esperar que apareguin els elements
    await page.waitForSelector(tabSelector, { timeout: 3000 });
    await page.click(tabSelector);
    
    // Esperar que l'AJAX d'APEX injecti finalment la llista d'intervencions al DOM després del clic
    await page.waitForSelector('#regio_estrats_report .t-MediaList-item', { state: 'attached', timeout: 15000 });

    // Extraure directament les dades renderitzades del DOM
    const items = await page.$$eval('#regio_estrats_report .t-MediaList-item', elements => {
      return elements.map(el => {
        const href = el.querySelector('a.video_posicionar')?.getAttribute('href') || '';
        const desc = el.querySelector('.t-MediaList-desc')?.innerHTML || '';
        return { href, desc };
      });
    });

    console.log(`📊 S'han trobat ${items.length} elements d'intervenció.`);

    let count = 0;

    for (const item of items) {
      // Exemple de la cadena HTML real que ens arriba a l'atribut href: posicionar('https://media.watchity.com/.../index.m3u8', 425, 17526854, '425', '532', 17526830)
      /* 
      EXPLICACIÓ DETALLADA DE LA FUNCIÓ JS 'posicionar' I ELS SEUS 6 PARÀMETRES:
    
      1. URL del vídeo (string entre cometes): 'https://media.watchity.com/.../index.m3u8'
        -> És l'enllaç directe al fitxer de streaming HLS.
      2. Posició en segons (número): 425 
        -> El segon exacte on comença la intervenció (s'utilitza per a 'posicio').
      3. Identificador intermedi o de grup (número): 17526854 
        -> Un codi intern del reproductor del ple.
      4. Posició en format text (string entre cometes): '425' 
        -> Repeteix la posició en format text.
      5. Codi o paràmetre intern secundari (string entre cometes): '532' 
        -> Paràmetre addicional de control de la interfície.
      6. ID del fragment de vídeo (número): 17526830 
        -> L'identificador real i únic del fragment de vídeo per a l'embed ('idVideoFragment').
      */

      // Regex per agafar matchPos[3] (ID del fragment real)
      const matchPos = item.href.match(/posicionar\([^,]+,\s*(\d+),\s*(\d+),\s*['"][^'"]+['],\s*['"][^'"]+['],\s*(\d+)\)/);
      if (!matchPos) 
        continue;

      const posicio = Number(matchPos[1]);
      const idVideoFragment = matchPos[3]; // ID real i específic del fragment pel reproductor

      if (await Video.exists({ idVideo, idVideoFragment, posicio })) { 
        console.log(`⏭️ El vídeo ${idVideo}, fragment ${idVideoFragment}, pos. ${posicio} ja existeix. Saltant...`); 
        continue; 
      }

      const parts = item.desc.split('<br>');
      if (parts.length < 2) 
        continue;

      const orador = parts[0].replace(/<\/?[^>]+(>|$)/g, '').trim();
      const textGrup = parts[1].replace(/<\/?[^>]+(>|$)/g, '').trim().toUpperCase();

      // Cerca dinàmica dins dels partits oficials de la legislatura a MongoDB
      const partitTrobat = partitsLegislatura.find(p => {
        const nomDb = p.nom.toUpperCase();
        const siglesDb = p.sigles.toUpperCase();

        return textGrup.includes(nomDb) || nomDb.includes(textGrup) || textGrup.includes(siglesDb);
      });

      if (!partitTrobat) 
        continue;

      await Video.findOneAndUpdate(
        { idVideo, idVideoFragment, posicio },
        {
          idVideo,
          idVideoFragment,
          posicio,
          legislaturaId: legislatura._id,
          partitId: partitTrobat._id,
          orador
        },
        { upsert: true, returnDocument: 'after' }
      );

      count++;
    }

    await browser.close();
    console.log(`   └─ ✅ Vídeo ${idVideo}: ${count} fragments sincronitzats.`);
  } catch (error) {
    console.error(`   └─ ❌ Error sincronitzant el vídeo ${idVideo}:`, error);
    await browser.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Error: Cal indicar un ID de vídeo i legislatura, o només el número de legislatura.');
    console.error('Ús 1 (Un sol vídeo): npx tsx scripts/sync-plenari.ts <VIDEO_ID> <NUM_LEGISLATURA>');
    console.error('Ús 2 (Tota la legislatura): npx tsx scripts/sync-plenari.ts <NUM_LEGISLATURA>');
    process.exit(1);
  }

  await connectDB();

  let legNumero: number;

  if (args.length === 1) {
    // Mode massiu per legislatura
    const legStr = args[0];
    legNumero = Number(legStr);

    const legislatura = await Legislatura.findOne({ numero: legNumero });
    if (!legislatura) {
      console.error(`❌ No s'ha trobat la legislatura número ${legNumero} a la base de dades.`);
      process.exit(1);
    }

    const partitsLegislatura = await Partit.find({ _id: { $in: legislatura.partitsIds } });

    // Obté els IDs de la legislatura (del fitxer JSON o fent l'extracció si no existeix)
    const idsVideos = await getOrFetchVideoIds(legStr);
    console.log(`📦 S'han de processar ${idsVideos.length} vídeos per a la legislatura ${legNumero}.`);

    for (const idVideo of idsVideos)
      await syncSingleVideo(idVideo, legNumero, legislatura, partitsLegislatura);

    console.log(`✅ S'han sincronitzat correctament tots els vídeos de la legislatura ${legNumero}!`);
    process.exit(0);

  } else {
    // Mode vídeo individual
    const idVideo = args[0];
    legNumero = Number(args[1]);

    const legislatura = await Legislatura.findOne({ numero: legNumero });
    if (!legislatura) {
      console.error(`❌ No s'ha trobat la legislatura número ${legNumero} a la base de dades.`);
      process.exit(1);
    }

    const partitsLegislatura = await Partit.find({ _id: { $in: legislatura.partitsIds } });

    await syncSingleVideo(idVideo, legNumero, legislatura, partitsLegislatura);
    process.exit(0);
  }
}

main();