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
 * resolution level. The lowest level is upscaled to the target face
 * size as a base; higher levels are composited on top, filling in
 * detail where their tiles exist. Wherever the highest level has
 * gaps the lower-resolution base shows through instead of going
 * black.
 *
 * Each level's face dimensions come from the XML's tiledimagewidth
 * attribute, not gridSize × tilePx. Autohome publishes faces sized
 * to non-multiples of the tile size (e.g. 3840 with 512px tiles),
 * where the last column/row of tiles is smaller than a full tile.
 * Using gridSize × tilePx for the canvas leaves a black border
 * around the photo content that shows up as a black band between
 * cube faces in the equirectangular projection.
 */
export async function stitchFaces(leveledTiles: LeveledTiles[]): Promise<FaceImage[]> {
  if (leveledTiles.length === 0) throw new Error("No levels provided to stitcher.");
  const sorted = [...leveledTiles].sort((a, b) => a.level.level - b.level.level);
  const top = sorted[sorted.length - 1]!.level;
  const targetSize = top.faceSize;

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

      const lvlFaceSize = lt.level.faceSize;
      const lvlTilePx = lt.level.tilePx;

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

      const scaled =
        lvlFaceSize === targetSize
          ? lvlAssembled
          : await sharp(lvlAssembled)
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

    const rgb = await canvas.flatten({ background: "#000" }).removeAlpha().raw().toBuffer();
    out.push({ face, size: targetSize, rgb });
  }
  return out;
}
