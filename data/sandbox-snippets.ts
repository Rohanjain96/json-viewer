export type SandboxSnippetCategory =
  | "Transform"
  | "Filter"
  | "Aggregate (data)"
  | "Group / Sort"
  | "Array ops (data)"
  | "Example";

export interface SandboxSnippet {
  label: string;
  code: string;
  category: SandboxSnippetCategory;
}

// Building-block operations, grouped by what they do to a single item ($) or
// the whole array (data). Merged with the runnable Examples below into one
// searchable list — both are "insert this into the editor" actions.
export const SANDBOX_SNIPPETS: SandboxSnippet[] = [
  { label: "pick", code: `pick($, ['id', 'title'])`, category: "Transform" },
  { label: "omit", code: `omit($, ['body'])`, category: "Transform" },
  { label: "add field", code: `{ ...$, newKey: $.id * 2 }`, category: "Transform" },
  { label: "rename key", code: `{ ...$, newName: $.title, title: undefined }`, category: "Transform" },
  { label: "spread +", code: `{ ...$, titleUpper: $.title.toUpperCase() }`, category: "Transform" },

  { label: "equals", code: `$.userId === 1`, category: "Filter" },
  { label: "range", code: `between($.id, 10, 20)`, category: "Filter" },
  { label: "contains", code: `$.title.includes('dolor')`, category: "Filter" },
  { label: "like", code: `like($.title, '%dolor%')`, category: "Filter" },
  { label: "in list", code: `inList($.userId, [1, 2, 3])`, category: "Filter" },
  { label: "is null", code: `isNull($.field)`, category: "Filter" },
  { label: "not null", code: `notNull($.field)`, category: "Filter" },

  { label: "count", code: `count(data)`, category: "Aggregate (data)" },
  { label: "count if", code: `count(data, $ => $.userId === 1)`, category: "Aggregate (data)" },
  { label: "sum", code: `sum(data, 'id')`, category: "Aggregate (data)" },
  { label: "avg", code: `avg(data, 'id')`, category: "Aggregate (data)" },
  { label: "min", code: `min(data, 'id')`, category: "Aggregate (data)" },
  { label: "max", code: `max(data, 'id')`, category: "Aggregate (data)" },
  { label: "stats", code: `stats(data, 'id')`, category: "Aggregate (data)" },

  { label: "groupBy", code: `groupBy(data, 'userId')`, category: "Group / Sort" },
  { label: "countBy", code: `countBy(data, 'userId')`, category: "Group / Sort" },
  { label: "sumBy", code: `sumBy(data, 'userId', 'id')`, category: "Group / Sort" },
  { label: "orderBy ↑", code: `orderBy(data, 'id', 'asc')`, category: "Group / Sort" },
  { label: "orderBy ↓", code: `orderBy(data, 'id', 'desc')`, category: "Group / Sort" },
  { label: "limit", code: `limit(data, 10)`, category: "Group / Sort" },
  { label: "skip", code: `skip(data, 5)`, category: "Group / Sort" },

  { label: "pluck", code: `pluck(data, 'title')`, category: "Array ops (data)" },
  { label: "uniq", code: `uniq(data, 'userId')`, category: "Array ops (data)" },
  { label: "flatten", code: `flatten(data)`, category: "Array ops (data)" },
  { label: "chunk", code: `chunk(data, 10)`, category: "Array ops (data)" },
  { label: "null rows", code: `nullRows(data)`, category: "Array ops (data)" },
  { label: "missing", code: `missingField(data, 'title')`, category: "Array ops (data)" },
  { label: "pivot", code: `pivot(data, 'userId', 'id', 'title')`, category: "Array ops (data)" },

  { label: "Posts by user 1", code: `$.userId === 1`, category: "Example" },
  { label: "Pick id + title", code: `pick($, ['id', 'title'])`, category: "Example" },
  { label: "Add title length", code: `{ ...$, titleLen: $.title.length }`, category: "Example" },
  { label: "Count per user", code: `countBy(data, 'userId')`, category: "Example" },
  { label: "Top 5 by id desc", code: `limit(orderBy(data, 'id', 'desc'), 5)`, category: "Example" },
  { label: "Stats on id", code: `stats(data, 'id')`, category: "Example" },
  { label: "Titles containing dolor", code: `like($.title, '%dolor%')`, category: "Example" },
  { label: "All unique userIds", code: `uniq(pluck(data, 'userId'))`, category: "Example" },
];
