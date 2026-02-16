import type { NextApiRequest, NextApiResponse } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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
    res.setHeader("Content-Type", "application/yaml");
    return res.status(200).send(content);
  } catch {
    return res.status(404).end();
  }
}
