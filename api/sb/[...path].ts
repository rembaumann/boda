import type { IncomingMessage, ServerResponse } from "node:http";
import { handleBoardProxy } from "../../src/server/boardProxy.js";

type RequestWithBody = IncomingMessage & { body?: unknown };

function header(req: IncomingMessage, name: string): string | null {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function readBody(req: RequestWithBody): Promise<string | null> {
  if (req.method === "GET" || req.method === "HEAD") return null;
  const provided = req.body;
  if (provided === undefined) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  if (typeof provided === "string") return provided;
  if (provided instanceof Uint8Array) return Buffer.from(provided).toString("utf8");
  return JSON.stringify(provided);
}

export default async function boardProxy(req: RequestWithBody, res: ServerResponse): Promise<void> {
  const result = await handleBoardProxy({
    method: req.method ?? "GET",
    url: req.url ?? "/",
    header: (name) => header(req, name),
    body: await readBody(req),
    supabaseUrl: process.env.VITE_SUPABASE_URL,
  });
  res.statusCode = result.status;
  res.setHeader("cache-control", "no-store");
  if (result.contentType) res.setHeader("content-type", result.contentType);
  if (result.contentRange) res.setHeader("content-range", result.contentRange);
  res.end(result.body);
}
