import { JSONValue } from "@/types/json";
import { useEffect, useRef, useState } from "react";

// Singleton worker — created once, reused across all hook calls.
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, (suggestions: string[]) => void>();

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL("../utils/suggestions-worker.ts", import.meta.url));
        worker.onmessage = (e: MessageEvent<{ id: number; suggestions: string[] }>) => {
            const resolve = pending.get(e.data.id);
            if (resolve) {
                pending.delete(e.data.id);
                resolve(e.data.suggestions);
            }
        };
    }
    return worker;
}

function suggestAsync(json: JSONValue, query: string): Promise<string[]> {
    return new Promise(resolve => {
        const id = nextId++;
        pending.set(id, resolve);
        // Structured clone handles the transfer — worker gets its own copy.
        getWorker().postMessage({ id, json, query });
    });
}

export function useJsonPathSuggestions(json: JSONValue, query: string) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track the latest request id so stale responses from slow queries are ignored.
    const latestId = useRef(-1);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        if (!query || !query.startsWith("$") || !json || typeof json !== "object") {
            setSuggestions([]);
            return;
        }

        timerRef.current = setTimeout(async () => {
            const requestId = nextId; // capture before the async call increments it
            latestId.current = requestId;

            const results = await suggestAsync(json, query);

            // Discard if a newer request has been issued since this one started.
            if (latestId.current === requestId) {
                setSuggestions(results);
            }
        }, 120);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // json intentionally excluded — we pass it through the worker message,
        // so we don't need React to re-run the effect when the reference changes.
        // The query change alone is enough to re-trigger suggestions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return suggestions;
}