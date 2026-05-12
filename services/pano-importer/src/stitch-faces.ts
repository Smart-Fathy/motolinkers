import sharp from "sharp";
import type { LevelConfig } from "./parse-autohome.js";
import type { TileResult } from "./download-tiles.js";

export type CubeFace = "f" | "b" | "l" | "r" | "u" | "d";
export const CUBE_FACES: CubeFace[] = ["f", "b", "l", "r", "u", "d"];

export interface FaceImage {
  face: CubeFace;
  size: number;
  rgb: Buffer;
}

interface LeveledTiles {
  level: LevelConfig;
  tiles: TileResult[];
}

/**
 * Build one square face image per cube side by layering each tile
 * resolution level. The lowest level (smallest, usually fully covered)
 * is upscaled to the target face size and used as a base; higher
 * levels are composited on top, filling in detail where their tiles
 * exist. Wherever the highest level has gaps the lower-resolution base
 * shows through instead of going black.
 */
export async function stitchFaces(leveledTiles: LeveledTiles[]): Promise<FaceImage[]> {
  if (leveledTiles.length === 0) throw new Error("No levels provided to stitcher.");
  // Sort ascending — base first, detail last.
  const sorted = [...leveledTiles].sort((a, b) => a.level.level - b.level.level);
  const top = sorted[sorted.length - 1]!.level;
  const targetSize = top.gridSize * top.tilePx;

  const tilesByLevelFace = new Map<string, TileResult[]>();
  for (const lt of sorted) {
    for (const t of lt.tiles) {
      const key = `${lt.level.level}/${t.face}`;
      const arr = tilesByLevelFace.get(key) ?? [];
      arr.push(t);
      tilesByLevelFace.set(key, arr);
    }
  }

  const out: FaceImage[] = [];
  for (const face of CUBE_FACES) {
    let canvas: sharp.Sharp | null = null;

    for (const lt of sorted) {
      const tiles = tilesByLevelFace.get(`${lt.level.level}/${face}`) ?? [];
      if (tiles.length === 0) continue;

      const lvlGridSize = lt.level.gridSize;
      const lvlTilePx = lt.level.tilePx;
      const lvlFaceSize = lvlGridSize * lvlTilePx;

      const lvlAssembled = await sharp({
        create: {
          width: lvlFaceSize,
          height: lvlFaceSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite(
          tiles.map((t) => ({
            input: t.buffer,
            left: t.x * lvlTilePx,
            top: t.y * lvlTilePx,
          })),
        )
        .png()
        .toBuffer();

      const scaled = await sharp(lvlAssembled)
        .resize(targetSize, targetSize, { fit: "fill", kernel: "lanczos3" })
        .png()
        .toBuffer();

      if (canvas === null) {
        canvas = sharp(scaled);
      } else {
        const base: Buffer = await canvas.png().toBuffer();
        canvas = sharp(base).composite([{ input: scaled }]);
      }
    }

    if (canvas === null) {
      throw new Error(`Cube face '${face}' has no tiles at any level.`);
    }

    // Autohome's face images have a centered photographic region
    // surrounded by black padding (each face only covers a sub-square
    // of its allotted area). Crop to the non-black bounds and stretch
    // back to face size so the photo fills the cube face. This avoids
    // the black bands between faces in the equirectangular output.
    const flat: Buffer = await canvas.flatten({ background: "#000" }).png().toBuffer();
    const trimmed = await sharp(flat)
      .trim({ threshold: 12 })
      .resize(targetSize, targetSize, { fit: "fill", kernel: "lanczos3" })
      .removeAlpha()
      .raw()
      .toBuffer();
    out.push({ face, size: targetSize, rgb: trimmed });
  }
  return out;
}
