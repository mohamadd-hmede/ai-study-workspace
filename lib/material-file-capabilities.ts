export type MaterialPreviewStrategy =
  | "pdf"
  | "image"
  | "text"
  | "code"
  | "docx"
  | "pptx"
  | "table"
  | "spreadsheet";

export type MaterialProcessingStrategy =
  | "original"
  | "text"
  | "docx"
  | "pptx"
  | "csv"
  | "xlsx";

export type MaterialFileCapability = {
  kind: string;
  previewStrategy: MaterialPreviewStrategy;
  processingStrategy: MaterialProcessingStrategy;
};

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const CSV_MIME_TYPES = new Set(["text/csv", "application/csv"]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "json",
  "xml",
  "yaml",
  "yml",
]);

const CODE_EXTENSIONS = new Set([
  "sql",
  "js",
  "jsx",
  "ts",
  "tsx",
  "java",
  "py",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "php",
  "rb",
  "go",
  "rs",
  "html",
  "css",
  "scss",
  "sh",
]);

const getExtension = (name: string): string => {
  const parts = name.toLowerCase().split(".");

  return parts.length > 1 ? (parts.pop() ?? "") : "";
};

export const getMaterialFileCapability = (
  name: string,
  mimeType: string,
): MaterialFileCapability | null => {
  const extension = getExtension(name);
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType === "application/pdf" || extension === "pdf") {
    return {
      kind: "pdf",
      previewStrategy: "pdf",
      processingStrategy: "original",
    };
  }

  if (normalizedMimeType.startsWith("image/")) {
    return {
      kind: "image",
      previewStrategy: "image",
      processingStrategy: "original",
    };
  }

  if (normalizedMimeType === DOCX_MIME_TYPE || extension === "docx") {
    return {
      kind: "docx",
      previewStrategy: "docx",
      processingStrategy: "docx",
    };
  }

  if (normalizedMimeType === PPTX_MIME_TYPE || extension === "pptx") {
    return {
      kind: "pptx",
      previewStrategy: "pptx",
      processingStrategy: "pptx",
    };
  }

  if (normalizedMimeType === XLSX_MIME_TYPE || extension === "xlsx") {
    return {
      kind: "xlsx",
      previewStrategy: "spreadsheet",
      processingStrategy: "xlsx",
    };
  }

  if (CSV_MIME_TYPES.has(normalizedMimeType) || extension === "csv") {
    return {
      kind: "csv",
      previewStrategy: "table",
      processingStrategy: "csv",
    };
  }

  if (CODE_EXTENSIONS.has(extension)) {
    return {
      kind: "code",
      previewStrategy: "code",
      processingStrategy: "text",
    };
  }

  if (
    normalizedMimeType.startsWith("text/") ||
    TEXT_EXTENSIONS.has(extension)
  ) {
    return {
      kind: "text",
      previewStrategy: "text",
      processingStrategy: "text",
    };
  }

  return null;
};

export const isKnownMaterialFile = (
  name: string,
  mimeType: string,
): boolean => {
  return getMaterialFileCapability(name, mimeType) !== null;
};

export const detectMaterialFileCapability = async (
  file: File,
): Promise<MaterialFileCapability | null> => {
  const knownCapability = getMaterialFileCapability(file.name, file.type);

  if (knownCapability) {
    return knownCapability;
  }

  if (file.size === 0) {
    return null;
  }

  const sampleSize = Math.min(file.size, 8192);
  const sample = await file.slice(0, sampleSize).arrayBuffer();
  const bytes = new Uint8Array(sample);

  if (bytes.length === 0) {
    return null;
  }

  let suspiciousBytes = 0;

  for (const byte of bytes) {
    if (byte === 0) {
      return null;
    }

    const isAllowedControlCharacter = byte === 9 || byte === 10 || byte === 13;

    if (byte < 32 && !isAllowedControlCharacter) {
      suspiciousBytes += 1;
    }
  }

  const suspiciousRatio = suspiciousBytes / bytes.length;

  if (suspiciousRatio > 0.01) {
    return null;
  }

  try {
    const text = new TextDecoder("utf-8", {
      fatal: true,
    }).decode(bytes, {
      stream: sampleSize < file.size,
    });

    if (!text.trim()) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    kind: "text",
    previewStrategy: "text",
    processingStrategy: "text",
  };
};
