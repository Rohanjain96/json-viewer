import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import net from "net";

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_TIMEOUT_MS = 15000;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    return (
      ip === "::1" ||
      ip.startsWith("fe80:") ||
      ip.startsWith("fc") ||
      ip.startsWith("fd")
    );
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    a === 0 ||
    (a === 169 && b === 254) || // covers cloud metadata endpoint 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      url,
      method = "GET",
      headers: reqHeaders = {},
      body: reqBody,
    } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "Only http/https URLs are allowed" },
        { status: 400 },
      );
    }

    if (parsed.hostname === "localhost") {
      return NextResponse.json(
        { error: "Private/local URLs not allowed via proxy" },
        { status: 403 },
      );
    }

    // Resolve DNS and check the actual IP(s) — checking the hostname string
    // alone doesn't stop a public hostname resolving to a private/internal IP.
    let resolvedIps: string[];
    try {
      resolvedIps = (await dns.lookup(parsed.hostname, { all: true })).map(
        (r) => r.address,
      );
    } catch {
      return NextResponse.json(
        { error: "Could not resolve host" },
        { status: 400 },
      );
    }
    if (resolvedIps.length === 0 || resolvedIps.some(isPrivateIp)) {
      return NextResponse.json(
        { error: "Private/local URLs not allowed via proxy" },
        { status: 403 },
      );
    }

    const t0 = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const fetchOptions: RequestInit = {
      method,
      headers: reqHeaders,
      signal: controller.signal,
      // Redirects aren't re-validated against the private-IP check below,
      // so a malicious redirect could still land on an internal host.
      // If this route is public-facing, consider "manual" and re-checking
      // each hop's resolved IP before following it.
    };
    if (reqBody && ["POST", "PUT", "PATCH"].includes(method)) {
      fetchOptions.body = reqBody;
    }

    let res: Response;
    try {
      res = await fetch(url, fetchOptions);
    } finally {
      clearTimeout(timeoutId);
    }

    const duration = Date.now() - t0;

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_RESPONSE_SIZE) {
      return NextResponse.json(
        { error: "Response too large (>10MB)" },
        { status: 413 },
      );
    }
    const text = Buffer.from(buf).toString("utf-8");

    const resHeaders: Record<string, string> = {};
    const skipHeaders = new Set([
      "content-encoding",
      "transfer-encoding",
      "connection",
    ]);
    res.headers.forEach((v, k) => {
      if (!skipHeaders.has(k.toLowerCase())) resHeaders[k] = v;
    });

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
      body: text,
      duration,
      size: buf.byteLength,
    });
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        error: isAbort
          ? `Request timed out (${REQUEST_TIMEOUT_MS / 1000}s)`
          : e instanceof Error
            ? e.message
            : "Proxy error",
      },
      { status: isAbort ? 504 : 500 },
    );
  }
}
