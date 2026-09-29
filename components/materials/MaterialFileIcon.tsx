import {
  Code2,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  Table2,
} from "lucide-react";

import type { Material } from "@/types/material";

import { getMaterialFileCapability } from "@/lib/material-file-capabilities";

type MaterialFileIconProps = {
  material: Material;
  className?: string;
};

export const getMaterialCapability = (material: Material) => {
  return (
    material.capability ??
    getMaterialFileCapability(
      material.originalFileName || material.name,
      material.type,
    )
  );
};

export const getMaterialFileLabel = (material: Material): string => {
  const capability = getMaterialCapability(material);

  switch (capability?.kind) {
    case "pdf":
      return "PDF";

    case "image": {
      const extension = material.originalFileName
        ?.split(".")
        .pop()
        ?.toUpperCase();

      return extension || "IMAGE";
    }

    case "docx":
      return "DOCX";

    case "pptx":
      return "PPTX";

    case "csv":
      return "CSV";

    case "xlsx":
      return "XLSX";

    case "code": {
      const extension = material.originalFileName
        ?.split(".")
        .pop()
        ?.toUpperCase();

      return extension || "CODE";
    }

    case "text": {
      const extension = material.originalFileName
        ?.split(".")
        .pop()
        ?.toUpperCase();

      return extension || "TEXT";
    }

    default:
      return "FILE";
  }
};

export const getMaterialFileStyle = (material: Material) => {
  const capability = getMaterialCapability(material);

  switch (capability?.kind) {
    case "pdf":
      return {
        icon: FileText,
        className: "bg-red-50 text-red-600",
      };

    case "image":
      return {
        icon: FileImage,
        className: "bg-emerald-50 text-emerald-600",
      };

    case "docx":
      return {
        icon: FileText,
        className: "bg-blue-50 text-blue-600",
      };

    case "pptx":
      return {
        icon: Presentation,
        className: "bg-orange-50 text-orange-600",
      };

    case "csv":
      return {
        icon: Table2,
        className: "bg-teal-50 text-teal-600",
      };

    case "xlsx":
      return {
        icon: FileSpreadsheet,
        className: "bg-green-50 text-green-600",
      };

    case "code":
      return {
        icon: Code2,
        className: "bg-slate-100 text-slate-700",
      };

    case "text":
      return {
        icon: FileText,
        className: "bg-violet-50 text-violet-600",
      };

    default:
      return {
        icon: File,
        className: "bg-slate-100 text-slate-600",
      };
  }
};

export default function MaterialFileIcon({
  material,
  className = "h-5 w-5",
}: MaterialFileIconProps) {
  const { icon: Icon } = getMaterialFileStyle(material);

  return <Icon className={className} strokeWidth={2} />;
}
