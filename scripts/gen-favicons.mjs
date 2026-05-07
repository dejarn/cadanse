import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const PUBLIC = path.join(ROOT, "public")
const SVG = path.join(PUBLIC, "favicon.svg")

// iOS apple-touch-icon must have a solid background (transparent => black square on iOS).
// The SVG already has a solid brand background; this is a defensive fallback.
const APPLE_BG = "#0F0E0D"

async function pngFromSvg(svg, size, { background } = {}) {
  let pipe = sharp(svg, { density: 384 }).resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  if (background) {
    pipe = pipe.flatten({ background })
  }
  return pipe.png().toBuffer()
}

// Minimal multi-image ICO writer (PNG-encoded entries — supported by all modern browsers + IE11+).
function buildIco(pngBuffers) {
  const count = pngBuffers.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type 1 = icon
  header.writeUInt16LE(count, 4)

  const entries = []
  const datas = []
  let offset = 6 + 16 * count

  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size === 256 ? 0 : size, 0) // width
    entry.writeUInt8(size === 256 ? 0 : size, 1) // height
    entry.writeUInt8(0, 2) // palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bpp
    entry.writeUInt32LE(buf.length, 8) // size
    entry.writeUInt32LE(offset, 12) // offset
    entries.push(entry)
    datas.push(buf)
    offset += buf.length
  }

  return Buffer.concat([header, ...entries, ...datas])
}

async function main() {
  const svg = await readFile(SVG)

  const targets = [
    { name: "favicon-16.png", size: 16 },
    { name: "favicon-32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180, background: APPLE_BG },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
  ]

  for (const t of targets) {
    const buf = await pngFromSvg(svg, t.size, { background: t.background })
    await writeFile(path.join(PUBLIC, t.name), buf)
    console.log(`✓ ${t.name} (${t.size}x${t.size})`)
  }

  const ico16 = await pngFromSvg(svg, 16)
  const ico32 = await pngFromSvg(svg, 32)
  const ico48 = await pngFromSvg(svg, 48)
  const ico = buildIco([
    { size: 16, buf: ico16 },
    { size: 32, buf: ico32 },
    { size: 48, buf: ico48 },
  ])
  await writeFile(path.join(PUBLIC, "favicon.ico"), ico)
  console.log("✓ favicon.ico (16+32+48)")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
