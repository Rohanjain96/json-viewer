"use client";
import { useState, useRef } from "react";
import { JSONValue } from "@/types/json";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AuthType = "none" | "bearer" | "basic" | "apikey" | "cookie";
type BodyType = "none" | "json" | "form";
type SendMode = "direct" | "proxy";

interface Header { key: string; value: string; enabled: boolean; }
interface Param { key: string; value: string; enabled: boolean; }

interface FetchResult {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: JSONValue;
    rawText: string;
    duration: number;
    size: string;
}

const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const METHOD_COLORS: Record<Method, string> = {
    GET: "var(--node-bool)", POST: "var(--success)",
    PUT: "var(--accent)", PATCH: "var(--node-num)", DELETE: "var(--btn-danger)",
};

const emptyRow = (): Header => ({ key: "", value: "", enabled: true });

function buildUrl(base: string, params: Param[]): string {
    const active = params.filter(p => p.enabled && p.key.trim());
    if (!active.length) return base;
    const qs = active.map(p =>
        `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
    ).join("&");
    return `${base}${base.includes("?") ? "&" : "?"}${qs}`;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusColor(s: number) {
    if (s < 300) return "var(--success)";
    if (s < 400) return "var(--accent)";
    return "var(--btn-danger)";
}

// ── KeyValueEditor ─────────────────────────────────────────────────────────
function KeyValueEditor({
    rows, onChange, placeholder = ["Key", "Value"],
}: {
    rows: Header[];
    onChange: (rows: Header[]) => void;
    placeholder?: [string, string];
}) {
    const update = (i: number, field: keyof Header, val: string | boolean) => {
        const next = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
        if (i === rows.length - 1 && field !== "enabled" && val) next.push(emptyRow());
        onChange(next);
    };
    const remove = (i: number) => {
        if (rows.length === 1) { onChange([emptyRow()]); return; }
        onChange(rows.filter((_, idx) => idx !== i));
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {rows.map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" checked={row.enabled}
                        onChange={e => update(i, "enabled", e.target.checked)}
                        style={{ flexShrink: 0, accentColor: "var(--accent)" }} />
                    <input value={row.key} onChange={e => update(i, "key", e.target.value)}
                        placeholder={placeholder[0]} style={iStyle} />
                    <input value={row.value} onChange={e => update(i, "value", e.target.value)}
                        placeholder={placeholder[1]} style={{ ...iStyle, flex: 2 }} />
                    <button onClick={() => remove(i)}
                        style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "1.1em", padding: "0 4px" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--btn-danger)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-faint)"}>×</button>
                </div>
            ))}
        </div>
    );
}

const iStyle: React.CSSProperties = {
    flex: 1, padding: "6px 10px", background: "var(--input-bg)",
    border: "1px solid var(--border)", borderRadius: 5,
    color: "var(--input-color)", fontFamily: "monospace",
    fontSize: "0.86em", outline: "none",
};

function Section({ title, children, defaultOpen = true }: {
    title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ border: "1px solid var(--border-faint)", borderRadius: 7, overflow: "hidden", flexShrink: 0 }}>
            <div onClick={() => setOpen(o => !o)}
                style={{ padding: "8px 12px", background: "var(--panel)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                <span style={{ color: "var(--text-faint)", fontSize: "0.79em" }}>{open ? "▾" : "▸"}</span>
                <span style={{ color: "var(--text-dim)", fontSize: "0.79em", fontWeight: 600, letterSpacing: 1 }}>{title}</span>
            </div>
            {open && <div style={{ padding: "10px 12px" }}>{children}</div>}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────
interface Props {
    // Receives the fetched response as raw text so the user can review/edit
    // it in the Import tab before it's parsed and applied to the explorer.
    onLoadToImport: (jsonText: string) => void;
}

export function ApiFetchTab({ onLoadToImport }: Props) {
    const [url, setUrl] = useState("");
    const [method, setMethod] = useState<Method>("GET");
    const [sendMode, setSendMode] = useState<SendMode>("proxy");
    const [headers, setHeaders] = useState<Header[]>([emptyRow()]);
    const [params, setParams] = useState<Param[]>([emptyRow()]);
    const [authType, setAuthType] = useState<AuthType>("none");
    const [bearerToken, setBearerToken] = useState("");
    const [basicUser, setBasicUser] = useState("");
    const [basicPass, setBasicPass] = useState("");
    const [apiKeyName, setApiKeyName] = useState("X-API-Key");
    const [apiKeyValue, setApiKeyValue] = useState("");
    const [cookieStr, setCookieStr] = useState("");
    const [bodyType, setBodyType] = useState<BodyType>("none");
    const [bodyText, setBodyText] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<FetchResult | null>(null);
    const [error, setError] = useState("");
    const [resTab, setResTab] = useState<"body" | "headers">("body");
    const [resView, setResView] = useState<"pretty" | "raw">("pretty");
    const [history, setHistory] = useState<{ method: Method; url: string }[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    const buildHeaders = (): Record<string, string> => {
        const h: Record<string, string> = {};
        headers.filter(r => r.enabled && r.key.trim()).forEach(r => { h[r.key.trim()] = r.value; });
        if (authType === "bearer" && bearerToken) h["Authorization"] = `Bearer ${bearerToken}`;
        else if (authType === "basic" && basicUser) h["Authorization"] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
        else if (authType === "apikey" && apiKeyValue) h[apiKeyName] = apiKeyValue;
        else if (authType === "cookie" && cookieStr) h["Cookie"] = cookieStr;
        if (bodyType === "json") h["Content-Type"] = "application/json";
        if (bodyType === "form") h["Content-Type"] = "application/x-www-form-urlencoded";
        return h;
    };

    const send = async () => {
        if (!url.trim()) { setError("URL is required"); return; }
        setLoading(true); setError(""); setResult(null);
        abortRef.current = new AbortController();

        const finalUrl = buildUrl(url.trim(), params);
        const finalHeaders = buildHeaders();
        const finalBody = ["POST", "PUT", "PATCH"].includes(method) && bodyType !== "none" ? bodyText : undefined;

        try {
            let ok: boolean, status: number, statusText: string;
            let resHeaders: Record<string, string> = {};
            let text: string, duration: number;

            if (sendMode === "proxy") {
                // ── via Next.js proxy route ──
                const proxyRes = await fetch("/api/proxy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: finalUrl, method, headers: finalHeaders, body: finalBody }),
                    signal: abortRef.current.signal,
                });
                const proxyData = await proxyRes.json();

                if (!proxyRes.ok && proxyData.error) {
                    setError(proxyData.error);
                    setLoading(false);
                    return;
                }

                ok = proxyData.ok;
                status = proxyData.status;
                statusText = proxyData.statusText;
                resHeaders = proxyData.headers ?? {};
                text = proxyData.body ?? "";
                duration = proxyData.duration ?? 0;

            } else {
                // ── direct fetch ──
                const t0 = performance.now();
                const res = await fetch(finalUrl, {
                    method,
                    headers: finalHeaders,
                    body: finalBody,
                    signal: abortRef.current.signal,
                    credentials: authType === "cookie" ? "include" : "same-origin",
                });
                duration = Math.round(performance.now() - t0);
                ok = res.ok; status = res.status; statusText = res.statusText;
                res.headers.forEach((v, k) => { resHeaders[k] = v; });
                text = await res.text();
            }

            let data: JSONValue;
            try { data = JSON.parse(text); }
            catch { data = text as unknown as JSONValue; }

            const size = formatSize(new Blob([text]).size);
            setResult({ ok, status, statusText, headers: resHeaders, data, rawText: text, duration, size });
            setHistory(h => [{ method, url: finalUrl }, ...h.filter(x => x.url !== finalUrl)].slice(0, 12));

        } catch (e) {
            if ((e as Error).name !== "AbortError") setError((e as Error).message || "Request failed");
            else setError("Request cancelled");
        } finally {
            setLoading(false);
        }
    };

    const labelStyle: React.CSSProperties = {
        color: "var(--text-faint)", fontSize: "0.72em",
        fontFamily: "monospace", letterSpacing: 1, fontWeight: 600,
        marginBottom: 4, display: "block",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0, overflow: "hidden" }}>

            {/* URL bar */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <select value={method} onChange={e => setMethod(e.target.value as Method)}
                    style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: METHOD_COLORS[method], fontFamily: "monospace", fontSize: "0.93em", fontWeight: 700, outline: "none", cursor: "pointer", flexShrink: 0 }}>
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>

                <input value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send()}
                    placeholder="https://api.example.com/endpoint"
                    style={{ ...iStyle, flex: 1, fontSize: "0.93em", padding: "8px 12px" }} />

                {/* Send mode toggle */}
                <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                    {(["proxy", "direct"] as SendMode[]).map(m => (
                        <button key={m} onClick={() => setSendMode(m)}
                            title={m === "proxy" ? "Route through Next.js proxy (bypasses CORS)" : "Direct fetch from browser"}
                            style={{ padding: "8px 12px", background: sendMode === m ? "var(--accent-bg)" : "var(--surface)", border: "none", color: sendMode === m ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.72em", fontFamily: "monospace", fontWeight: sendMode === m ? 700 : 400 }}>
                            {m === "proxy" ? "⇄ Proxy" : "⇡ Direct"}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <button onClick={() => abortRef.current?.abort()}
                        style={{ padding: "8px 14px", background: "var(--danger)", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: "monospace", fontSize: "0.86em", fontWeight: 600, flexShrink: 0 }}>
                        ✕ Cancel
                    </button>
                ) : (
                    <button onClick={send}
                        style={{ padding: "8px 20px", background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: "monospace", fontSize: "0.93em", fontWeight: 600, flexShrink: 0 }}>
                        Send ▶
                    </button>
                )}
            </div>

            {/* Proxy mode hint */}
            <div style={{ fontSize: "0.72em", fontFamily: "monospace", color: "var(--text-faint)", flexShrink: 0 }}>
                {sendMode === "proxy"
                    ? "⇄ Proxy mode — requests routed via /api/proxy, bypasses CORS. Cookies sent from server."
                    : "⇡ Direct mode — browser sends request directly. May hit CORS on cross-origin APIs."}
            </div>

            {/* History */}
            {history.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0 }}>
                    {history.map((h, i) => (
                        <button key={i} onClick={() => setUrl(h.url)}
                            style={{ padding: "2px 8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: "0.72em", display: "flex", alignItems: "center", gap: 5, color: "var(--text-dim)" }}>
                            <span style={{ color: METHOD_COLORS[h.method], fontWeight: 700 }}>{h.method}</span>
                            <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.url}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Scrollable config area */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1, minHeight: 0 }}>

                <Section title="QUERY PARAMS" defaultOpen={false}>
                    <KeyValueEditor rows={params} onChange={setParams} placeholder={["param", "value"]} />
                </Section>

                <Section title="HEADERS" defaultOpen={false}>
                    <KeyValueEditor rows={headers} onChange={setHeaders} placeholder={["Header-Name", "value"]} />
                </Section>

                <Section title="AUTH">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        {(["none", "bearer", "basic", "apikey", "cookie"] as AuthType[]).map(a => (
                            <button key={a} onClick={() => setAuthType(a)}
                                style={{ padding: "4px 12px", background: authType === a ? "var(--accent-bg)" : "var(--surface)", border: `1px solid ${authType === a ? "var(--accent)" : "var(--border)"}`, borderRadius: 4, color: authType === a ? "var(--accent)" : "var(--text-dim)", cursor: "pointer", fontSize: "0.79em", fontFamily: "monospace" }}>
                                {a === "none" ? "No Auth" : a === "bearer" ? "Bearer" : a === "basic" ? "Basic" : a === "apikey" ? "API Key" : "Cookie"}
                            </button>
                        ))}
                    </div>

                    {authType === "bearer" && (
                        <div>
                            <label style={labelStyle}>TOKEN</label>
                            <input value={bearerToken} onChange={e => setBearerToken(e.target.value)}
                                type="password" placeholder="eyJhbGci..."
                                style={{ ...iStyle, width: "100%", boxSizing: "border-box" }} />
                        </div>
                    )}
                    {authType === "basic" && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>USERNAME</label>
                                <input value={basicUser} onChange={e => setBasicUser(e.target.value)} placeholder="username" style={iStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>PASSWORD</label>
                                <input value={basicPass} onChange={e => setBasicPass(e.target.value)} type="password" placeholder="password" style={iStyle} />
                            </div>
                        </div>
                    )}
                    {authType === "apikey" && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>HEADER NAME</label>
                                <input value={apiKeyName} onChange={e => setApiKeyName(e.target.value)} placeholder="X-API-Key" style={iStyle} />
                            </div>
                            <div style={{ flex: 2 }}>
                                <label style={labelStyle}>VALUE</label>
                                <input value={apiKeyValue} onChange={e => setApiKeyValue(e.target.value)} type="password" placeholder="your-api-key" style={iStyle} />
                            </div>
                        </div>
                    )}
                    {authType === "cookie" && (
                        <div>
                            <label style={labelStyle}>COOKIE STRING</label>
                            <input value={cookieStr} onChange={e => setCookieStr(e.target.value)}
                                placeholder="session=abc123; token=xyz"
                                style={{ ...iStyle, width: "100%", boxSizing: "border-box" }} />
                            <div style={{ color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace", marginTop: 4 }}>
                                In proxy mode cookies are sent as header. In direct mode credentials:include is used.
                            </div>
                        </div>
                    )}
                </Section>

                {["POST", "PUT", "PATCH"].includes(method) && (
                    <Section title="BODY">
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                            {(["none", "json", "form"] as BodyType[]).map(b => (
                                <button key={b} onClick={() => setBodyType(b)}
                                    style={{ padding: "4px 12px", background: bodyType === b ? "var(--accent-bg)" : "var(--surface)", border: `1px solid ${bodyType === b ? "var(--accent)" : "var(--border)"}`, borderRadius: 4, color: bodyType === b ? "var(--accent)" : "var(--text-dim)", cursor: "pointer", fontSize: "0.79em", fontFamily: "monospace" }}>
                                    {b === "none" ? "None" : b === "json" ? "JSON" : "Form Encoded"}
                                </button>
                            ))}
                        </div>
                        {bodyType !== "none" && (
                            <textarea value={bodyText} onChange={e => setBodyText(e.target.value)}
                                placeholder={bodyType === "json" ? '{\n  "key": "value"\n}' : "key=value&foo=bar"}
                                spellCheck={false} rows={6}
                                style={{ ...iStyle, width: "100%", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
                        )}
                    </Section>
                )}

                {/* Error */}
                {error && (
                    <div style={{ padding: "8px 12px", background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: 6, color: "var(--btn-danger)", fontFamily: "monospace", fontSize: "0.86em", flexShrink: 0 }}>
                        ⚠ {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                        <span style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: "0.86em" }}>
                            {sendMode === "proxy" ? "Sending via proxy…" : "Sending request…"}
                        </span>
                    </div>
                )}

                {/* Response */}
                {result && (
                    <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border-faint)", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>

                        {/* Response meta */}
                        <div style={{ padding: "8px 12px", background: "var(--panel)", borderBottom: "1px solid var(--border-faint)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.93em", color: statusColor(result.status) }}>
                                {result.status} {result.statusText}
                            </span>
                            <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>{result.duration}ms</span>
                            <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>{result.size}</span>

                            <div style={{ display: "flex", gap: 3 }}>
                                {(["body", "headers"] as const).map(t => (
                                    <button key={t} onClick={() => setResTab(t)}
                                        style={{ padding: "2px 10px", background: resTab === t ? "var(--accent-bg)" : "none", border: resTab === t ? "1px solid var(--accent)" : "1px solid transparent", borderRadius: 4, color: resTab === t ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.79em", fontFamily: "monospace" }}>
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {resTab === "body" && (
                                <div style={{ display: "flex", gap: 3 }}>
                                    {(["pretty", "raw"] as const).map(v => (
                                        <button key={v} onClick={() => setResView(v)}
                                            style={{ padding: "2px 8px", background: resView === v ? "var(--accent-bg)" : "none", border: resView === v ? "1px solid var(--accent)" : "1px solid transparent", borderRadius: 4, color: resView === v ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.72em", fontFamily: "monospace" }}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                                <button
                                    onClick={() => onLoadToImport(
                                        typeof result.data === "string" ? result.rawText : JSON.stringify(result.data, null, 2)
                                    )}
                                    style={{ padding: "4px 12px", background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: 5, color: "var(--success)", cursor: "pointer", fontSize: "0.79em", fontFamily: "monospace", fontWeight: 600 }}>
                                    → Edit in Import
                                </button>
                            </div>
                        </div>

                        {/* Response body — max height so it doesn't push page */}
                        <div style={{ maxHeight: 400, overflowY: "auto", padding: 12 }}>
                            {resTab === "headers" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {Object.entries(result.headers).map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", gap: 10, fontFamily: "monospace", fontSize: "0.86em", borderBottom: "1px solid var(--border-faint)", padding: "4px 0" }}>
                                            <span style={{ color: "var(--node-key)", flexShrink: 0, minWidth: 180 }}>{k}</span>
                                            <span style={{ color: "var(--text-dim)", wordBreak: "break-all" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <pre style={{ color: "var(--text)", fontFamily: "monospace", fontSize: "0.86em", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                                    {resView === "raw" || typeof result.data === "string"
                                        ? result.rawText
                                        : JSON.stringify(result.data, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}