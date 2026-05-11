import sharp from "sharp";
import type { TileResult } from "./download-tiles.js";

export type CubeFace = "f" | "b" | "l" | "r" | "u" | "d";
export const CUBE_FACES: CubeFace[] = ["f", "b", "l", "r", "u", "d"];

export interface FaceImage {
  face: CubeFace;
  size: number;
  rgb: Buffer;
}

/**
 * Compose tiles into one square image per cube face. The grid we
 * requested may be larger than what autohome actually serves, so we
 * shrink each face to the smallest power-of-tile that covers every
 * tile we got back. Missing tiles inside that bound are left black.
 */
export async function stitchFaces(
  tiles: TileResult[],
  _gridSize: number,
  tilePx: number,
): Promise<FaceImage[]> {
  const byFace = new Map<string, TileResult[]>();
  for (const t of tiles) {
    const arr = byFace.get(t.face) ?? [];
    arr.push(t);
    byFace.set(t.face, arr);
  }

  const out: FaceImage[] = [];
  for (const face of CUBE_FACES) {
    const list = byFace.get(face);
    if (!list || list.length === 0) {
      throw new Error(`Cube face '${face}' has no tiles. Autohome may not serve this face.`);
    }
    let maxX = 0;
    let maxY = 0;
    for (const t of list) {
      if (t.x > maxX) maxX = t.x;
      if (t.y > maxY) maxY = t.y;
    }
    const cols = maxX + 1;
    const rows = maxY + 1;
    if (cols !== rows) {
      throw new Error(
        `Cube face '${face}' is non-square: ${cols}x${rows}. Cubemap projection requires square faces.`,
      );
    }
    const faceSize = cols * tilePx;
    const composites = list.map((t) => ({
      input: t.buffer,
      left: t.x * tilePx,
      top: t.y * tilePx,
    }));
    const stitched = await sharp({
      create: {
        width: faceSize,
        height: faceSize,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite(composites)
      .removeAlpha()
      .raw()
      .toBuffer();
    out.push({ face, size: faceSize, rgb: stitched });
  }
  return out;
}
