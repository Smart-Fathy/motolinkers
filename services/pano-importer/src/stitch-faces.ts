import sharp from "sharp";
import type { TileResult } from "./download-tiles.js";

export type CubeFace = "f" | "b" | "l" | "r" | "u" | "d";
export const CUBE_FACES: CubeFace[] = ["f", "b", "l", "r", "u", "d"];

export interface FaceImage {
  face: CubeFace;
  size: number;
  rgb: Buffer;
}

export async function stitchFaces(
  tiles: TileResult[],
  gridSize: number,
  tilePx: number,
): Promise<FaceImage[]> {
  if (gridSize < 1) throw new Error(`Bad grid size: ${gridSize}`);
  const faceSize = gridSize * tilePx;
  const byFace = new Map<string, TileResult[]>();
  for (const t of tiles) {
    const arr = byFace.get(t.face) ?? [];
    arr.push(t);
    byFace.set(t.face, arr);
  }
  const out: FaceImage[] = [];
  for (const face of CUBE_FACES) {
    const list = byFace.get(face);
    if (!list || list.length !== gridSize * gridSize) {
      throw new Error(
        `Face '${face}' has ${list?.length ?? 0} tiles, expected ${gridSize * gridSize}.`,
      );
    }
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
