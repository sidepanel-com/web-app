import type { NextApiRequest, NextApiResponse } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }
  try {
    const path = join(process.cwd(), "docs/api/product-v1.yaml");
    const content = await readFile(path, "utf-8");
    const spec = parseYaml(content);
    res.setHeader("Cache-Control", "public, s-maxage=60");
    return res.status(200).json(spec);
  } catch {
    return res.status(404).end();
  }
}
