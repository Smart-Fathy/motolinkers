import Fastify from "fastify";
import PQueue from "p-queue";
import { cubeToEquirect } from "./cube-to-equirect.js";
import { downloadTiles, type TileRequest } from "./download-tiles.js";
import { parseAutohome } from "./parse-autohome.js";
import { stitchFaces } from "./stitch-faces.js";
import { uploadToR2 } from "./upload-r2.js";

const app = Fastify({ logger: true });
const queue = new PQueue({ concurrency: 2 });

app.get("/health", async () => ({ ok: true }));

app.post<{ Body: { url?: string; slug?: string } }>("/import-pano", async (req, reply) => {
  const auth = req.headers.authorization ?? "";
  const expected = `Bearer ${requireEnv("IMPORTER_AUTH_TOKEN")}`;
  if (auth !== expected) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
  const url = req.body?.url?.trim();
  const slug = req.body?.slug?.trim();
  if (!url || !slug) {
    return reply.code(400).send({ error: "Body must include { url, slug }." });
  }
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    return reply.code(400).send({ error: "Slug must be alphanumeric/dashes." });
  }

  try {
    const panoUrl = await queue.add(() => importOne(url, slug), { throwOnTimeout: true });
    return reply.send({ panoUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    req.log.error({ err: e }, "import failed");
    return reply.code(422).send({ error: msg });
  }
});

async function importOne(url: string, slug: string): Promise<string> {
  const cfg = await parseAutohome(url);
  const FACES = ["f", "b", "l", "r", "u", "d"] as const;

  const leveled = await Promise.all(
    cfg.levels.map(async (lvl) => {
      const requests: TileRequest[] = [];
      for (const face of FACES) {
        for (let y = 0; y < lvl.gridSize; y++) {
          for (let x = 0; x < lvl.gridSize; x++) {
            requests.push({ url: lvl.tileUrl(face, x, y), face, x, y });
          }
        }
      }
      const tiles = await downloadTiles(requests);
      return { level: lvl, tiles };
    }),
  );

  const faces = await stitchFaces(leveled);
  const jpeg = await cubeToEquirect(faces);
  const key = `${slug}/pano/autohome-${Date.now()}.jpg`;
  return uploadToR2({ key, body: jpeg, contentType: "image/jpeg" });
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const port = Number(process.env.PORT ?? 3000);
app.listen({ host: "0.0.0.0", port }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});
