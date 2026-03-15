import { JSONValue } from "./json";

export interface QueryMatch {
  value: JSONValue;
  path: string;
}

export interface QuerySuccess {
  type: "success";
  results: QueryMatch[];
}

export interface QueryError {
  type: "error";
  error: string;
}

export type QueryResult = QuerySuccess | QueryError;
