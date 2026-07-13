// Genera los iconos PWA (192 y 512) a partir de un SVG de marca.
// Uso: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const OUT_DIR = 'public/icons'
const BG = '#2f6fed'

function svg(size) {
  const fontSize = Math.round(size * 0.56)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${BG}"/>
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-weight="700"
      font-size="${fontSize}" fill="#ffffff">G</text>
  </svg>`
}

await mkdir(OUT_DIR, { recursive: true })
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg(size)))
    .png()
    .toFile(`${OUT_DIR}/icon-${size}.png`)
  console.log(`✓ icon-${size}.png`)
}
