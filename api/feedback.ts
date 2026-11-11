import type { IncomingMessage, ServerResponse } from "node:http";
import { handleFeedback } from "../src/server/feedbackHandler.js";

type RequestWithBody = IncomingMessage & { body?: unknown };

function header(req: IncomingMessage, name: string): string | null {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function clientIp(req: IncomingMessage): string {
  const forwarded = header(req, "x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = header(req, "x-real-ip");
  if (real) return real.trim();
  return req.socket.remoteAddress ?? "unknown";
}

async function rawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function feedback(req: RequestWithBody, res: ServerResponse): Promise<void> {
  let body: unknown = req.body;
  if (body === undefined) body = await rawBody(req);
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(body)) body = body.toString("utf8");
  const result = await handleFeedback({
    method: req.method ?? "GET",
    contentType: header(req, "content-type"),
    body,
    ip: clientIp(req),
    userAgent: header(req, "user-agent") ?? "",
    now: Date.now(),
    env: {
      linearApiKey: process.env.LINEAR_API_KEY,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "dev",
    },
  });
  res.statusCode = result.status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(result.body));
}
