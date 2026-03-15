"use client";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useState, useEffect, useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface LeafField {
    path: string;
    type: string;
    sample: unknown;
    subFields?: LeafField[];
}

interface Condition {
    id: number;
    kind: "condition";
    field: string;
    op: string;
    val: string;
}

interface Group {
    id: number;
    kind: "group";
    logic: "AND" | "OR";
    children: (Condition | Group | SubArray)[];
}

interface SubArray {
    id: number;
    kind: "subarray";
    arrayField: string;
    logic: "AND" | "OR";
    children: Condition[];
}

// ─── ID GENERATOR ─────────────────────────────────────────────────────────────
let _nodeId = 0;
const newId = () => ++_nodeId;

// ─── OPS BY TYPE ──────────────────────────────────────────────────────────────
const OPS_BY_TYPE: Record<string, string[]> = {
    string: ["=", "!=", "contains", "starts_with", "ends_with", "regex"],
    number: ["=", "!=", ">", "<", ">=", "<="],
    boolean: ["=", "!="],
    default: ["=", "!="],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function getLeafFields(sample: unknown, prefix = "", depth = 0): LeafField[] {
    if (!sample || typeof sample !== "object" || depth > 4) return [];
    const fields: LeafField[] = [];
    for (const [k, v] of Object.entries(sample as Record<string, unknown>)) {
        const p = prefix ? `${prefix}.${k}` : k;
        if (Array.isArray(v)) {
            if (v.length > 0 && typeof v[0] === "object")
                fields.push({ path: p, type: "array", sample: v, subFields: getLeafFields(v[0], "", 0) });
        } else if (typeof v === "object" && v !== null) {
            fields.push(...getLeafFields(v, p, depth + 1));
        } else {
            fields.push({ path: p, type: typeof v, sample: v });
        }
    }
    return fields;
}

export function navigatePath(json: unknown, dotPath: string): unknown {
    if (!dotPath) return json;
    return dotPath.split(".").filter(Boolean).reduce((acc: unknown, k) =>
        acc != null && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined, json);
}

export function toNavPath(jsonPath: string): string {
    return jsonPath.replace(/^\$\.?/, "").replace(/\[\*\]/g, "").replace(/\.$/, "");
}

// ─── SERIALIZER ───────────────────────────────────────────────────────────────
function serializeCond(c: Condition, leafFields: LeafField[]): string {
    const fld = leafFields.find(f => f.path === c.field);
    const isNum = fld?.type === "number";
    const isBool = fld?.type === "boolean";
    const v = isBool || isNum ? c.val : `"${c.val}"`;
    if (c.op === "contains") return `@.${c.field}.includes(${v})`;
    if (c.op === "starts_with") return `@.${c.field}.startsWith(${v})`;
    if (c.op === "ends_with") return `@.${c.field}.endsWith(${v})`;
    if (c.op === "regex") return `@.${c.field}.match(/${c.val}/)`;
    const op = c.op === "=" ? "==" : c.op;
    return `@.${c.field} ${op} ${v}`;
}

function serializeGroup(group: Group | SubArray, leafFields: LeafField[]): string {
    const parts = group.children.map(child => {
        if (child.kind === "condition") return serializeCond(child, leafFields);
        if (child.kind === "group") {
            const inner = serializeGroup(child as Group, leafFields);
            return inner ? `(${inner})` : "";
        }
        if (child.kind === "subarray") {
            const parentFld = leafFields.find(f => f.path === (child as SubArray).arrayField);
            const subFlds = parentFld?.subFields || [];
            const innerExpr = serializeGroup(child as SubArray, subFlds);
            return innerExpr ? `@.${(child as SubArray).arrayField}[?(${innerExpr})]` : "";
        }
        return "";
    }).filter(Boolean);
    if (parts.length === 0) return "";
    const op = group.logic === "AND" ? " && " : " || ";
    return parts.join(op);
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const selStyle: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "8px 12px",
    fontFamily: "monospace",
    fontSize: "0.93em",
    outline: "none",
    color: "var(--input-color)",
    cursor: "pointer",
    width: "100%",
};

const dangerBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "var(--btn-danger)",
    cursor: "pointer",
    fontSize: "1.14em",
    lineHeight: 1,
    padding: 0,
    opacity: 0.6,
};

// ─── CONDITION ROW ────────────────────────────────────────────────────────────
function ConditionRow({ cond, leafFields, onUpdate, onRemove, isMobile, depth }: {
    cond: Condition; leafFields: LeafField[];
    onUpdate: (key: string, val: string) => void;
    onRemove: () => void; isMobile: boolean; depth: number;
}) {
    const fld = leafFields.find(f => f.path === cond.field);
    const ops = OPS_BY_TYPE[fld?.type ?? "default"] || OPS_BY_TYPE.default;
    const isBool = fld?.type === "boolean";

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 130px 1fr 30px",
            gap: 8, alignItems: "center",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 12px",
            borderLeft: `3px solid ${depth === 0 ? "var(--accent)" : "var(--node-null)"}`,
        }}>
            <select aria-label="pick field" value={cond.field} onChange={e => onUpdate("field", e.target.value)} style={selStyle}>
                {leafFields.filter(f => f.type !== "array").map(f => (
                    <option key={f.path} value={f.path}>{f.path} ({f.type})</option>
                ))}
            </select>

            <select aria-label="pick operator" value={cond.op} onChange={e => onUpdate("op", e.target.value)} style={{ ...selStyle, color: "var(--node-num)" }}>
                {ops.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            {isBool ? (
                <select aria-label="pick value" value={cond.val} onChange={e => onUpdate("val", e.target.value)} style={{ ...selStyle, color: "var(--node-bool)" }}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            ) : (
                <input aria-label="enter value" value={cond.val} onChange={e => onUpdate("val", e.target.value)}
                    placeholder={fld ? `e.g. ${String(fld.sample ?? "")}` : "value"}
                    style={{ ...selStyle, color: "var(--node-str)" }} />
            )}

            <button onClick={onRemove} style={{ ...dangerBtn, justifySelf: "center" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}>×</button>
        </div>
    );
}

// ─── SUB-ARRAY NODE ───────────────────────────────────────────────────────────
function SubArrayNode({ node, leafFields, onChange, onRemove, isMobile, depth }: {
    node: SubArray; leafFields: LeafField[];
    onChange: (n: SubArray) => void; onRemove: () => void;
    isMobile: boolean; depth: number;
}) {
    const parentField = leafFields.find(f => f.path === node.arrayField);
    const subLeafFields = parentField?.subFields || [];

    const toggleLogic = () => onChange({ ...node, logic: node.logic === "AND" ? "OR" : "AND" });

    const addCondition = () => {
        const first = subLeafFields.find(f => f.type !== "array");
        if (!first) return;
        const c: Condition = { id: newId(), kind: "condition", field: first.path, op: OPS_BY_TYPE[first.type]?.[0] ?? "=", val: String(first.sample ?? "") };
        onChange({ ...node, children: [...node.children, c] });
    };

    const updateChild = (id: number, updater: (c: Condition) => Condition) =>
        onChange({ ...node, children: node.children.map(c => c.id === id ? updater(c as Condition) : c) as Condition[] });
    const removeChild = (id: number) =>
        onChange({ ...node, children: node.children.filter(c => c.id !== id) as Condition[] });

    return (
        <div style={{ border: "1px solid var(--accent)", borderRadius: 10, background: "var(--surface)", overflow: "hidden", opacity: 0.95 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--accent-bg)", borderBottom: node.children.length > 0 ? "1px solid var(--border)" : "none", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-dim)", fontSize: "0.72em", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600 }}>SUB-ARRAY</span>
                <span style={{ color: "var(--accent)", fontSize: "0.86em", fontFamily: "monospace", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>
                    {node.arrayField}[*]
                </span>
                <button onClick={toggleLogic} style={{ padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: "0.79em", fontWeight: 700, background: "var(--surface)", color: "var(--accent)" }}>
                    {node.logic}
                </button>
                <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>on sub-items</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    {subLeafFields.length > 0 && (
                        <button onClick={addCondition} style={{ padding: "3px 10px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 5, color: "var(--text-dim)", cursor: "pointer", fontSize: "0.79em" }}>
                            + Sub-Condition
                        </button>
                    )}
                    <button onClick={onRemove} style={{ ...dangerBtn, padding: "3px 8px" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}>×</button>
                </div>
            </div>

            {node.children.length > 0 && (
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {node.children.map((child, i) => (
                        <div key={child.id}>
                            {i > 0 && <div style={{ textAlign: "center", padding: "2px 0 6px", color: "var(--accent)", fontSize: "0.72em", fontFamily: "monospace", letterSpacing: 2 }}>{node.logic}</div>}
                            {child.kind === "condition" && (
                                <ConditionRow cond={child as Condition} leafFields={subLeafFields} isMobile={isMobile} depth={depth}
                                    onUpdate={(key, val) => {
                                        const updated = { ...child, [key]: val } as Condition;
                                        if (key === "field") { const fld = subLeafFields.find(f => f.path === val); updated.op = OPS_BY_TYPE[fld?.type ?? "default"]?.[0] ?? "="; updated.val = String(fld?.sample ?? ""); }
                                        updateChild(child.id, () => updated);
                                    }}
                                    onRemove={() => removeChild(child.id)} />
                            )}
                        </div>
                    ))}
                </div>
            )}
            {node.children.length === 0 && (
                <div style={{ padding: "12px", color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace", textAlign: "center" }}>
                    {subLeafFields.length === 0 ? `No filterable fields in ${node.arrayField}` : `Add a sub-condition to filter ${node.arrayField} items`}
                </div>
            )}
        </div>
    );
}

// ─── GROUP NODE ───────────────────────────────────────────────────────────────
function GroupNode({ group, leafFields, onChange, onRemove, isMobile, depth = 0 }: {
    group: Group; leafFields: LeafField[];
    onChange: (g: Group) => void; onRemove: (() => void) | null;
    isMobile: boolean; depth?: number;
}) {
    const isRoot = depth === 0;

    const updateChild = (id: number, updater: (c: Condition | Group | SubArray) => Condition | Group | SubArray) =>
        onChange({ ...group, children: group.children.map(c => c.id === id ? updater(c) : c) });
    const removeChild = (id: number) =>
        onChange({ ...group, children: group.children.filter(c => c.id !== id) });

    const addCondition = () => {
        const first = leafFields.find(f => f.type !== "array");
        if (!first) return;
        const newCond: Condition = { id: newId(), kind: "condition", field: first.path, op: OPS_BY_TYPE[first.type]?.[0] ?? "=", val: String(first.sample ?? "") };
        onChange({ ...group, children: [...group.children, newCond] });
    };

    const addGroup = () => {
        const nested: Group = { id: newId(), kind: "group", logic: "AND", children: [] };
        onChange({ ...group, children: [...group.children, nested] });
    };

    const addSubArrayFilter = (arrayField: string) => {
        const subArr: SubArray = { id: newId(), kind: "subarray", arrayField, logic: "AND", children: [] };
        onChange({ ...group, children: [...group.children, subArr] });
    };

    const toggleLogic = () => onChange({ ...group, logic: group.logic === "AND" ? "OR" : "AND" });
    const arrayFields = leafFields.filter(f => f.type === "array");

    const depthColors = ["var(--accent)", "var(--node-null)", "var(--node-num)"];
    const borderColor = depthColors[Math.min(depth, 2)];

    return (
        <div style={{ border: `1px solid ${borderColor}`, borderRadius: 10, background: isRoot ? "transparent" : "var(--surface)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: isRoot ? "var(--accent-bg)" : `${borderColor}18`, borderBottom: group.children.length > 0 ? `1px solid ${borderColor}44` : "none", flexWrap: "wrap" }}>
                {!isRoot && <span style={{ color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600 }}>GROUP</span>}
                <button onClick={toggleLogic} style={{ padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: "0.79em", fontWeight: 700, background: "var(--surface)", color: "var(--accent)" }}>
                    {group.logic}
                </button>
                <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>
                    {group.logic === "AND" ? "all must match" : "any must match"}
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={addCondition} style={{ padding: "3px 10px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 5, color: "var(--text-dim)", cursor: "pointer", fontSize: "0.79em" }}>+ Condition</button>
                    <button onClick={addGroup} style={{ padding: "3px 10px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 5, color: "var(--node-null)", cursor: "pointer", fontSize: "0.79em" }}>+ Group</button>
                    {arrayFields.map(af => (
                        <button key={af.path} onClick={() => addSubArrayFilter(af.path)}
                            style={{ padding: "3px 10px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 5, color: "var(--accent)", cursor: "pointer", fontSize: "0.79em" }}>
                            ⊂ {af.path}[]
                        </button>
                    ))}
                    {!isRoot && onRemove && (
                        <button onClick={onRemove} style={{ ...dangerBtn, padding: "3px 8px" }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}>×</button>
                    )}
                </div>
            </div>

            {/* Children */}
            {group.children.length > 0 && (
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {group.children.map((child, i) => (
                        <div key={child.id}>
                            {i > 0 && (
                                <div style={{ textAlign: "center", padding: "2px 0 6px", color: borderColor, fontSize: "0.72em", fontFamily: "monospace", letterSpacing: 2 }}>
                                    {group.logic}
                                </div>
                            )}
                            {child.kind === "condition" && (
                                <ConditionRow cond={child as Condition} leafFields={leafFields} isMobile={isMobile} depth={depth}
                                    onUpdate={(key, val) => {
                                        const updated = { ...child, [key]: val } as Condition;
                                        if (key === "field") { const fld = leafFields.find(f => f.path === val); updated.op = OPS_BY_TYPE[fld?.type ?? "default"]?.[0] ?? "="; updated.val = String(fld?.sample ?? ""); }
                                        updateChild(child.id, () => updated);
                                    }}
                                    onRemove={() => removeChild(child.id)} />
                            )}
                            {child.kind === "group" && (
                                <GroupNode group={child as Group} leafFields={leafFields} isMobile={isMobile} depth={depth + 1}
                                    onChange={updated => updateChild(child.id, () => updated)}
                                    onRemove={() => removeChild(child.id)} />
                            )}
                            {child.kind === "subarray" && (
                                <SubArrayNode node={child as SubArray} leafFields={leafFields} isMobile={isMobile} depth={depth + 1}
                                    onChange={updated => updateChild(child.id, () => updated)}
                                    onRemove={() => removeChild(child.id)} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {group.children.length === 0 && (
                <div style={{ padding: "16px 12px", color: "var(--text-faint)", fontSize: "0.86em", fontFamily: "monospace", textAlign: "center" }}>
                    Empty group — add a condition or nested group above
                </div>
            )}
        </div>
    );
}

// ─── PATH BREADCRUMB PICKER ───────────────────────────────────────────────────
function PathBreadcrumbPicker({ json, value, onChange }: {
    json: unknown; value: string;
    onChange: (path: string, steps: string[]) => void;
}) {

    const initialSteps = useMemo(() => {
        const nav = toNavPath(value);
        return nav ? nav.split(".").filter(Boolean) : [];
    }, [json, value]);

    const [steps, setSteps] = useState(initialSteps);

    const nodeAtDepth = (depth: number): unknown => {
        let node: unknown = json;
        for (let i = 0; i < depth; i++) {
            if (node && typeof node === "object" && !Array.isArray(node)) node = (node as Record<string, unknown>)[steps[i]];
            else if (Array.isArray(node)) node = node[0];
            else return undefined;
        }
        return node;
    };

    const commitPath = (newSteps: string[]) => {
        const dotPath = newSteps.join(".");
        onChange(dotPath ? `$.${dotPath}` : "$", newSteps);
    };

    const selectors: { depth: number; keys: string[]; currentKey: string }[] = [];
    for (let depth = 0; depth <= steps.length; depth++) {
        const node = nodeAtDepth(depth);
        if (node === undefined || node === null) break;
        const sampleNode = Array.isArray(node) ? node[0] : node;
        if (!sampleNode || typeof sampleNode !== "object") break;
        const keys = Object.keys(sampleNode as object);
        if (keys.length === 0) break;
        selectors.push({ depth, keys, currentKey: steps[depth] });
        if (!steps[depth]) break;
        const chosen = (sampleNode as Record<string, unknown>)[steps[depth]];
        if (Array.isArray(chosen) && chosen.length > 0 && typeof chosen[0] === "object") break;
        if (typeof chosen === "object" && chosen !== null) continue;
        break;
    }

    const resolvedNode = nodeAtDepth(steps.length);
    const isArray = Array.isArray(resolvedNode);
    const isArrayOfObjects = isArray && (resolvedNode as unknown[]).length > 0 && typeof (resolvedNode as unknown[])[0] === "object";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                <span style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: "0.93em" }}>$</span>
                {steps.map((s, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "var(--text-faint)", fontSize: "0.93em" }}>.</span>
                        <button onClick={() => { const ns = steps.slice(0, i + 1); setSteps(ns); commitPath(ns); }}
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 10px", color: "var(--node-key)", fontFamily: "monospace", fontSize: "0.93em", cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                            {s}
                        </button>
                    </span>
                ))}
                {isArrayOfObjects && <span style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: "0.86em" }}>[*]</span>}
                {steps.length > 0 && (
                    <button onClick={() => { setSteps([]); commitPath([]); }}
                        style={{ marginLeft: 4, background: "none", border: "none", color: "var(--btn-danger)", cursor: "pointer", fontSize: "0.93em", lineHeight: 1, padding: "0 2px", opacity: 0.7 }}
                        title="Reset path"
                        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}>↺</button>
                )}
            </div>

            {/* Key selectors */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {selectors.length === 0 ? (
                    <select aria-label="pick starting key" value="" onChange={e => { if (!e.target.value) return; const ns = [e.target.value]; setSteps(ns); commitPath(ns); }} style={{ ...selStyle, minWidth: 160, width: "auto" }}>
                        <option value="">— pick starting key —</option>
                        {Object.keys((json as Record<string, unknown>) || {}).map(k => {
                            const v = (json as Record<string, unknown>)[k];
                            const tag = Array.isArray(v) ? "[]" : typeof v === "object" && v ? "{}" : typeof v;
                            return <option key={k} value={k}>{k} ({tag})</option>;
                        })}
                    </select>
                ) : selectors.map(({ depth, keys, currentKey }) => (
                    <div key={depth} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {depth > 0 && <span style={{ color: "var(--text-faint)", fontSize: "0.86em" }}>›</span>}
                        <select aria-label="pick key" value={currentKey || ""} onChange={e => { if (!e.target.value) return; const ns = [...steps.slice(0, depth), e.target.value]; setSteps(ns); commitPath(ns); }} style={{ ...selStyle, maxWidth: 160, width: "auto" }}>
                            <option value="">— pick key —</option>
                            {keys.map(k => {
                                const pn = nodeAtDepth(depth);
                                const sp = Array.isArray(pn) ? (pn as unknown[])[0] : pn;
                                const v = (sp as Record<string, unknown>)?.[k];
                                const tag = Array.isArray(v) ? "[]" : typeof v === "object" && v ? "{}" : typeof v;
                                return <option key={k} value={k}>{k} ({tag})</option>;
                            })}
                        </select>
                    </div>
                ))}
            </div>

            {/* Status */}
            {steps.length > 0 && (
                <div style={{ fontSize: "0.79em", fontFamily: "monospace", color: isArrayOfObjects ? "var(--success)" : "var(--text-dim)" }}>
                    {isArrayOfObjects
                        ? `✓ Array of objects — ${(resolvedNode as unknown[]).length} item${(resolvedNode as unknown[]).length !== 1 ? "s" : ""} (filterable)`
                        : isArray ? "✓ Array — will return all items"
                            : typeof resolvedNode === "object" && resolvedNode ? "✓ Object — will return this object"
                                : `✓ ${typeof resolvedNode} — will return this value`}
                </div>
            )}
        </div>
    );
}

// ─── VISUAL QUERY BUILDER ─────────────────────────────────────────────────────
interface Props {
    onQuery: (q: string) => void;
    json: unknown;
}

export function VisualQueryBuilder({ onQuery, json }: Props) {
    const { isMobile } = useBreakpoint();
    const [targetPath, setTargetPath] = useState("$");
    const [rootGroup, setRootGroup] = useState<Group>({ id: newId(), kind: "group", logic: "AND", children: [] });


    const resolvedTarget = (() => {
        const navPath = toNavPath(targetPath);
        return navigatePath(json, navPath);
    })();

    const targetIsArray = Array.isArray(resolvedTarget);
    const targetIsObjArr = targetIsArray && (resolvedTarget as unknown[]).length > 0 && typeof (resolvedTarget as unknown[])[0] === "object";
    const targetIsObj = !targetIsArray && resolvedTarget !== null && typeof resolvedTarget === "object";
    const targetIsPrimitive = resolvedTarget !== null && resolvedTarget !== undefined && !targetIsArray && !targetIsObj;
    const hasTarget = resolvedTarget !== undefined && resolvedTarget !== null && targetPath !== "$";
    const canFilter = targetIsObjArr;

    const arrayData = targetIsObjArr ? (resolvedTarget as unknown[]) : [];
    const leafFields = getLeafFields(arrayData[0] || {});
    const hasConditions = rootGroup.children.length > 0;

    const buildQuery = (): string => {
        const base = targetPath === "$" ? "$" : targetPath.replace(/\[\*\]$/, "");
        if (targetIsPrimitive || targetIsObj) return base;
        if (targetIsObjArr) {
            const filterExpr = serializeGroup(rootGroup, leafFields);
            return filterExpr ? `${base}[?(${filterExpr})]` : `${base}[*]`;
        }
        return base;
    };

    const query = buildQuery();

    const runHint = () => {
        if (!hasTarget) return "Select a key above to begin";
        if (targetIsPrimitive) return `Returns the value at ${targetPath}`;
        if (targetIsObj) return `Returns the object at ${targetPath}`;
        if (targetIsObjArr && !hasConditions) return `Returns all ${(resolvedTarget as unknown[]).length} items`;
        if (targetIsObjArr && hasConditions) return `Filters ${(resolvedTarget as unknown[]).length} items`;
        return "";
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Target picker */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ color: "var(--text-dim)", fontSize: "0.79em", letterSpacing: 1, fontFamily: "monospace", fontWeight: 600 }}>SELECT TARGET</div>
                <div style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>
                    Pick any key — primitive, object, or array. Filters only apply to arrays of objects.
                </div>
                <PathBreadcrumbPicker json={json} value={targetPath}
                    onChange={(newPath, _steps) => { setTargetPath(newPath); setRootGroup({ id: newId(), kind: "group", logic: "AND", children: [] }); }} />

                {hasTarget && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{
                            padding: "2px 10px", borderRadius: 10, fontSize: "0.72em", fontFamily: "monospace", fontWeight: 600,
                            background: targetIsObjArr ? "var(--success-bg)" : targetIsObj ? "var(--accent-bg)" : "var(--surface)",
                            border: `1px solid ${targetIsObjArr ? "var(--success-border)" : targetIsObj ? "var(--accent)" : "var(--border)"}`,
                            color: targetIsObjArr ? "var(--success)" : targetIsObj ? "var(--accent)" : "var(--node-null)",
                        }}>
                            {targetIsObjArr ? `array[${(resolvedTarget as unknown[]).length}]` : targetIsObj ? "object" : targetIsArray ? "array (primitives)" : typeof resolvedTarget}
                        </span>
                        <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>{runHint()}</span>
                    </div>
                )}
            </div>

            {/* Field chips */}
            {canFilter && leafFields.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {leafFields.map(f => (
                        <span key={f.path} style={{ padding: "2px 8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: "0.72em", fontFamily: "monospace", color: f.type === "number" ? "var(--node-num)" : f.type === "boolean" ? "var(--node-bool)" : f.type === "array" ? "var(--accent)" : "var(--node-key)" }}>
                            {f.path}<span style={{ color: "var(--text-faint)" }}>:{f.type === "array" ? "array[]" : f.type}</span>
                        </span>
                    ))}
                </div>
            )}

            {/* Group builder */}
            {canFilter && (
                <GroupNode group={rootGroup} leafFields={leafFields} isMobile={isMobile} depth={0}
                    onChange={setRootGroup} onRemove={null} />
            )}

            {/* No target yet */}
            {!hasTarget && (
                <div style={{ color: "var(--text-faint)", fontSize: "0.86em", fontFamily: "monospace", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 8, padding: "14px", textAlign: "center" }}>
                    ↑ Select any key above — primitive, object, or array
                </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => onQuery(query)} disabled={!hasTarget}
                    style={{ padding: "9px 22px", background: !hasTarget ? "var(--surface)" : "var(--accent)", border: !hasTarget ? "1px solid var(--border)" : "none", borderRadius: 7, color: !hasTarget ? "var(--text-faint)" : "#ffffff", cursor: !hasTarget ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: "0.93em", fontWeight: 600 }}>
                    {targetIsPrimitive ? "Fetch Value →" : targetIsObj ? "Fetch Object →" : "Run Filter →"}
                </button>
                {hasConditions && (
                    <button onClick={() => setRootGroup({ id: newId(), kind: "group", logic: "AND", children: [] })}
                        style={{ padding: "9px 14px", background: "none", border: "1px solid var(--danger-border)", borderRadius: 7, color: "var(--btn-danger)", cursor: "pointer", fontFamily: "monospace", fontSize: "0.86em" }}>
                        Reset
                    </button>
                )}
            </div>

            {/* Query preview */}
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border)" }}>
                <div style={{ color: "var(--text-faint)", fontSize: "0.72em", letterSpacing: 1, marginBottom: 8, fontFamily: "monospace", fontWeight: 600 }}>GENERATED QUERY</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.93em", color: "var(--accent)", wordBreak: "break-all", lineHeight: 1.7 }}>
                    {hasTarget ? query : "—"}
                </div>
            </div>
        </div>
    );
}