import type { MaterialFileCapability } from "@/lib/material-file-capabilities";

export type Material = {
  id: string;
  courseId: string;
  name: string;
  originalFileName: string;
  path: string;
  type: string;
  size: number;
  createdAt: number;
  capability?: MaterialFileCapability;
};
