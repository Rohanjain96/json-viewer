import { JSONValue } from "@/types/json";

export interface NodeClickPayload {
  path: string;
  type: string;
  value: JSONValue;
}

export interface TreeNodeProps {
  nodeKey?: string | number;
  value: JSONValue;
  depth?: number;
  path?: string;
  isMobile: boolean;
  onNodeClick: (payload: NodeClickPayload) => void;
}
