"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/lib/supabase/server";

export async function importAutohomePano(input: {
  url: string;
  slug: string;
}): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as unknown as {
    PANO_IMPORTER_URL?: string;
    PANO_IMPORTER_TOKEN?: string;
  };
  const importerUrl = cfEnv.PANO_IMPORTER_URL ?? process.env.PANO_IMPORTER_URL;
  const token = cfEnv.PANO_IMPORTER_TOKEN ?? process.env.PANO_IMPORTER_TOKEN;
  if (!importerUrl || !token) {
    return { error: "Pano importer is not configured (missing PANO_IMPORTER_URL/TOKEN)." };
  }

  const url = input.url?.trim();
  const slug = input.slug?.trim();
  if (!url || !slug) return { error: "Both URL and slug are required." };
  if (!/pano\.autohome\.com\.cn/i.test(url)) {
    return { error: "Not an autohome pano URL." };
  }

  try {
    const res = await fetch(`${importerUrl.replace(/\/$/, "")}/import-pano`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, slug }),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as
      | { panoUrl?: string; error?: string }
      | null;
    if (!res.ok || !body || !body.panoUrl) {
      return { error: body?.error ?? `Importer returned HTTP ${res.status}.` };
    }
    return { url: body.panoUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Could not reach pano importer: ${msg}.` };
  }
}
