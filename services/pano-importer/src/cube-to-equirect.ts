import sharp from "sharp";
import type { CubeFace, FaceImage } from "./stitch-faces.js";

const PI = Math.PI;
const TWO_PI = 2 * PI;

export async function cubeToEquirect(faces: FaceImage[], outWidth = 6144): Promise<Buffer> {
  const outHeight = Math.round(outWidth / 2);
  const faceMap = new Map<CubeFace, FaceImage>();
  for (const f of faces) faceMap.set(f.face, f);
  for (const k of ["f", "b", "l", "r", "u", "d"] as const) {
    if (!faceMap.has(k)) throw new Error(`Missing cube face '${k}' for projection.`);
  }
  const out = Buffer.allocUnsafe(outWidth * outHeight * 3);

  for (let y = 0; y < outHeight; y++) {
    const lat = PI / 2 - (y / outHeight) * PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    for (let x = 0; x < outWidth; x++) {
      const lon = (x / outWidth) * TWO_PI - PI;
      const dx = cosLat * Math.sin(lon);
      const dy = sinLat;
      const dz = cosLat * Math.cos(lon);
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const az = Math.abs(dz);

      let face: CubeFace;
      let uc: number;
      let vc: number;
      let maxAxis: number;
      if (ax >= ay && ax >= az) {
        if (dx > 0) {
          face = "r";
          maxAxis = ax;
          uc = -dz;
          vc = -dy;
        } else {
          face = "l";
          maxAxis = ax;
          uc = dz;
          vc = -dy;
        }
      } else if (ay >= ax && ay >= az) {
        if (dy > 0) {
          face = "u";
          maxAxis = ay;
          uc = dx;
          vc = dz;
        } else {
          face = "d";
          maxAxis = ay;
          uc = dx;
          vc = -dz;
        }
      } else {
        if (dz > 0) {
          face = "f";
          maxAxis = az;
          uc = dx;
          vc = -dy;
        } else {
          face = "b";
          maxAxis = az;
          uc = -dx;
          vc = -dy;
        }
      }
      const u = 0.5 * (uc / maxAxis + 1);
      const v = 0.5 * (vc / maxAxis + 1);
      const fimg = faceMap.get(face)!;
      sample(fimg, u, v, out, (y * outWidth + x) * 3);
    }
  }

  return await sharp(out, { raw: { width: outWidth, height: outHeight, channels: 3 } })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

function sample(face: FaceImage, u: number, v: number, out: Buffer, outIdx: number): void {
  const size = face.size;
  const fx = clamp(u * (size - 1), 0, size - 1);
  const fy = clamp(v * (size - 1), 0, size - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, size - 1);
  const y1 = Math.min(y0 + 1, size - 1);
  const dx = fx - x0;
  const dy = fy - y0;
  const rgb = face.rgb;
  const i00 = (y0 * size + x0) * 3;
  const i10 = (y0 * size + x1) * 3;
  const i01 = (y1 * size + x0) * 3;
  const i11 = (y1 * size + x1) * 3;
  const w00 = (1 - dx) * (1 - dy);
  const w10 = dx * (1 - dy);
  const w01 = (1 - dx) * dy;
  const w11 = dx * dy;
  for (let c = 0; c < 3; c++) {
    const v0 = rgb[i00 + c]! * w00 + rgb[i10 + c]! * w10 + rgb[i01 + c]! * w01 + rgb[i11 + c]! * w11;
    out[outIdx + c] = v0 < 0 ? 0 : v0 > 255 ? 255 : v0;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
