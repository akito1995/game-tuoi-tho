import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFinalCleanBoats() {
  const root = process.cwd();
  const dir1 = path.join(root, 'public', 'art', 'ambient');
  const dir2 = path.join(root, 'public', 'art', '_clean', 'ambient');

  // ==================== BOAT 1 (Wooden Rowing Boat) ====================
  // Cleanly trace hull, woman, nón lá, with zero water ring
  const meta1 = await sharp('public/art/ambient/ambient-thuyen-1.png').metadata();
  const w1 = meta1.width, h1 = meta1.height;

  const ptsBoat1 = [
    // Top of conical hat (nón lá)
    [305, 14],
    [328, 22],
    [352, 42],
    [366, 64], // right tip of nón lá
    // Gunwale towards bow (upper right)
    [382, 75],
    [408, 88],
    [435, 104],
    [458, 120],
    [466, 130], // bow tip
    [462, 140],
    [448, 154],
    [430, 170],
    [410, 188],
    [385, 208],
    [355, 225],
    // Hull bottom waterline curve (hugging bottom wood planks)
    [330, 232],
    [305, 246],
    [275, 258],
    [245, 268],
    [215, 274],
    [185, 279],
    [155, 283],
    [125, 284],
    [95, 278],
    [70, 265],
    [52, 248],
    [40, 236], // left boat prow tip
    // Far gunwale (top wood rail from left tip to woman's sleeve)
    [55, 228],
    [75, 212],
    [95, 198],
    [115, 184],
    [135, 170],
    [155, 158],
    [175, 148],
    [195, 138],
    [215, 128],
    [235, 116],
    [250, 110], // woman's sleeve
    [262, 75],  // woman's back
    // Left edge of nón lá
    [268, 55],
    [280, 36],
    [295, 22],
    [305, 14]
  ];

  const svgPath1 = ptsBoat1.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ') + ' Z';
  const maskSvg1 = `<svg width="${w1}" height="${h1}" viewBox="0 0 ${w1} ${h1}"><path d="${svgPath1}" fill="white" /></svg>`;
  const maskBuf1 = await sharp(Buffer.from(maskSvg1)).png().toBuffer();

  const masked1 = await sharp('public/art/ambient/ambient-thuyen-1.png')
    .composite([{ input: maskBuf1, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const finalBoat1 = await sharp(masked1)
    .trim({ threshold: 5 })
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(dir1, 'ambient-thuyen-1.png'), finalBoat1);
  fs.writeFileSync(path.join(dir2, 'ambient-thuyen-1.png'), finalBoat1);
  console.log('Saved ambient-thuyen-1.png to ambient and _clean directories');

  // ==================== BOAT 2 (Swan Pedalo Boat) ====================
  const meta2 = await sharp('public/art/ambient/ambient-thuyen-2.png').metadata();
  const w2 = meta2.width, h2 = meta2.height;

  const ptsBoat2 = [
    // Swan beak tip (orange beak at left)
    [78, 106],
    [88, 86],
    [106, 74],
    [125, 58],
    [146, 52], // crown of swan head
    [165, 55],
    // Roof top edge
    [185, 48],
    [220, 38],
    [260, 38],
    [300, 42],
    [335, 50],
    [365, 66],
    [390, 88], // roof top-right corner
    // Back arch window and rear wing curve
    [402, 115],
    [412, 145],
    [418, 175],
    [428, 205],
    [425, 218], // rear bumper tip
    [412, 226],
    // Bottom rubber bumper waterline (right to left)
    [390, 238],
    [370, 254],
    [350, 268],
    [330, 280],
    [310, 290],
    [290, 296],
    [250, 302],
    [210, 302],
    [170, 302],
    [140, 298],
    [120, 292],
    [100, 282],
    [80, 268],
    [60, 250],
    // Front prow curve under swan neck
    [52, 238],
    [58, 220],
    [70, 202],
    [85, 180],
    [100, 160],
    // Swan neck front/lower curve up to beak
    [112, 140],
    [115, 125],
    [105, 115],
    [92, 110],
    [78, 106]
  ];

  const svgPath2 = ptsBoat2.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ') + ' Z';
  const maskSvg2 = `<svg width="${w2}" height="${h2}" viewBox="0 0 ${w2} ${h2}"><path d="${svgPath2}" fill="white" /></svg>`;
  const maskBuf2 = await sharp(Buffer.from(maskSvg2)).png().toBuffer();

  const masked2 = await sharp('public/art/ambient/ambient-thuyen-2.png')
    .composite([{ input: maskBuf2, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const finalBoat2 = await sharp(masked2)
    .trim({ threshold: 5 })
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(dir1, 'ambient-thuyen-2.png'), finalBoat2);
  fs.writeFileSync(path.join(dir2, 'ambient-thuyen-2.png'), finalBoat2);
  console.log('Saved ambient-thuyen-2.png to ambient and _clean directories');
}

generateFinalCleanBoats();
