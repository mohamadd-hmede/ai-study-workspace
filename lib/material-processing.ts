import { puter } from "@heyputer/puter.js";
import mammoth from "mammoth";
import JSZip from "jszip";
import * as XLSX from "xlsx";

import type { Material } from "@/types/material";

import { getMaterialFileCapability } from "@/lib/material-file-capabilities";

import { renderMaterialPages } from "@/lib/material-rendering";

const MATERIAL_PROCESSING_MODEL = "claude-sonnet-4-6";

const MAX_EXTRACTED_TEXT_LENGTH = 100_000;

const readMaterialFile = async (material: Material): Promise<ArrayBuffer> => {
  const file = await puter.fs.read(material.path);

  return await file.arrayBuffer();
};

const limitExtractedText = (text: string): string => {
  const trimmedText = text.trim();

  if (trimmedText.length <= MAX_EXTRACTED_TEXT_LENGTH) {
    return trimmedText;
  }

  return `${trimmedText.slice(
    0,
    MAX_EXTRACTED_TEXT_LENGTH,
  )}\n\n[Learnadio truncated this material because it was too large to send in one AI request.]`;
};

const extractTextFile = async (material: Material): Promise<string> => {
  const file = await puter.fs.read(material.path);
  const text = await file.text();

  return limitExtractedText(text);
};

const extractDocxText = async (material: Material): Promise<string> => {
  const arrayBuffer = await readMaterialFile(material);

  const result = await mammoth.extractRawText({
    arrayBuffer,
  });

  return limitExtractedText(result.value);
};

const extractPptxText = async (material: Material): Promise<string> => {
  const arrayBuffer = await readMaterialFile(material);
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => {
      const aNumber = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      const bNumber = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0);

      return aNumber - bNumber;
    });

  const slidesText: string[] = [];

  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async("text");

    const document = new DOMParser().parseFromString(xml, "application/xml");

    const textNodes = Array.from(document.getElementsByTagName("a:t"));

    const slideText = textNodes
      .map((node) => node.textContent ?? "")
      .filter((text) => text.trim())
      .join("\n")
      .trim();

    const slideNumber = Number(slidePath.match(/slide(\d+)\.xml/)?.[1] ?? 0);

    if (slideText) {
      slidesText.push(`--- Slide ${slideNumber} ---\n${slideText}`);
    }
  }

  return limitExtractedText(slidesText.join("\n\n"));
};

const extractCsvText = async (material: Material): Promise<string> => {
  const file = await puter.fs.read(material.path);
  const text = await file.text();

  if (!text.trim()) {
    return "";
  }

  return limitExtractedText(`CSV tabular data:\n\n${text}`);
};

const extractXlsxText = async (material: Material): Promise<string> => {
  const arrayBuffer = await readMaterialFile(material);

  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
  });

  const sheetsText: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      continue;
    }

    const csv = XLSX.utils.sheet_to_csv(sheet).trim();

    if (!csv) {
      continue;
    }

    sheetsText.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }

  return limitExtractedText(sheetsText.join("\n\n"));
};

const extractResponseText = (content: unknown): string => {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (typeof block === "string") {
        return block;
      }

      if (
        block &&
        typeof block === "object" &&
        "type" in block &&
        "text" in block &&
        block.type === "text" &&
        typeof block.text === "string"
      ) {
        return block.text;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
};

const processExtractedText = async (
  extractedText: string,
  prompt: string,
): Promise<string> => {
  const response = await puter.ai.chat(
    `${prompt}\n\nStudy material:\n${extractedText}`,
    {
      model: MATERIAL_PROCESSING_MODEL,
    },
  );

  const text = extractResponseText(response.message?.content);

  if (!text) {
    throw new Error("AI did not return a valid text response.");
  }

  return text;
};

const processOriginalFile = async (
  material: Material,
  prompt: string,
): Promise<string> => {
  const response = await puter.ai.chat(
    [
      {
        role: "user",
        content: [
          {
            type: "file",
            puter_path: material.path,
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
    {
      model: MATERIAL_PROCESSING_MODEL,
    },
  );

  const text = extractResponseText(response.message?.content);

  if (!text) {
    throw new Error("AI did not return a valid text response.");
  }

  return text;
};

const blobToDataUrl = async (blob: Blob): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not prepare rendered page for AI."));
    };

    reader.onerror = () => {
      reject(new Error("Could not prepare rendered page for AI."));
    };

    reader.readAsDataURL(blob);
  });
};

const processOfficeMaterial = async (
  material: Material,
  extractedText: string,
  prompt: string,
): Promise<string> => {
  try {
    const pages = await renderMaterialPages(material);

    const imageUrls = await Promise.all(
      pages.map((page) => blobToDataUrl(page.image)),
    );

    const officePrompt = `
${prompt}

You are analyzing a study material.

The rendered images are the complete visual pages/slides in their original order.

Use BOTH:
1. The rendered page/slide images for visual information such as diagrams, charts, arrows, shapes, positioning, grouping, images, and relationships.
2. The extracted text below for accurate readable text.

Do not ignore visual information just because it is not described in the extracted text.

Extracted material text:
${extractedText || "[No readable text was extracted.]"}
`;

    const response = await puter.ai.chat(officePrompt, imageUrls, {
      model: MATERIAL_PROCESSING_MODEL,
    });

    const text = extractResponseText(response.message?.content);

    if (!text) {
      throw new Error("AI did not return a valid text response.");
    }

    return text;
  } catch (error) {
    console.warn(
      "Visual Office processing failed. Falling back to extracted text:",
      error,
    );

    if (!extractedText) {
      throw new Error("Learnadio could not process this Office material.");
    }

    return await processExtractedText(extractedText, prompt);
  }
};

export const processMaterial = async (
  material: Material,
  prompt: string,
): Promise<string> => {
  const capability =
    material.capability ??
    getMaterialFileCapability(
      material.originalFileName || material.name,
      material.type,
    );

  if (!capability) {
    throw new Error(
      "Learnadio does not know how to process this material type.",
    );
  }

  switch (capability.processingStrategy) {
    case "original":
      return await processOriginalFile(material, prompt);

    case "text": {
      const extractedText = await extractTextFile(material);

      if (!extractedText) {
        throw new Error("Could not extract readable text from this material.");
      }

      return await processExtractedText(extractedText, prompt);
    }

    case "docx": {
      const extractedText = await extractDocxText(material);

      return await processOfficeMaterial(material, extractedText, prompt);
    }

    case "pptx": {
      const extractedText = await extractPptxText(material);

      return await processOfficeMaterial(material, extractedText, prompt);
    }

    case "csv": {
      const extractedText = await extractCsvText(material);

      if (!extractedText) {
        throw new Error("Could not extract data from CSV material.");
      }

      return await processExtractedText(extractedText, prompt);
    }

    case "xlsx": {
      const extractedText = await extractXlsxText(material);

      if (!extractedText) {
        throw new Error("Could not extract data from XLSX material.");
      }

      return await processExtractedText(extractedText, prompt);
    }

    default:
      throw new Error(
        "Learnadio does not support AI processing for this material type.",
      );
  }
};
