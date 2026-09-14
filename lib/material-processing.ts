import { puter } from "@heyputer/puter.js";
import mammoth from "mammoth";
import JSZip from "jszip";

import type { Material } from "@/types/material";

const MATERIAL_PROCESSING_MODEL = "claude-sonnet-4-6";

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const readMaterialFile = async (material: Material): Promise<ArrayBuffer> => {
  const file = await puter.fs.read(material.path);

  return await file.arrayBuffer();
};

const extractDocxText = async (material: Material): Promise<string> => {
  const arrayBuffer = await readMaterialFile(material);

  const result = await mammoth.extractRawText({
    arrayBuffer,
  });

  return result.value.trim();
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
      .join(" ")
      .trim();

    if (slideText) {
      slidesText.push(slideText);
    }
  }

  return slidesText.join("\n\n").trim();
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

export const processMaterial = async (
  material: Material,
  prompt: string,
): Promise<string> => {
  if (material.type === DOCX_MIME_TYPE) {
    const extractedText = await extractDocxText(material);

    if (!extractedText) {
      throw new Error("Could not extract text from DOCX material.");
    }

    return await processExtractedText(extractedText, prompt);
  }

  if (material.type === PPTX_MIME_TYPE) {
    const extractedText = await extractPptxText(material);

    if (!extractedText) {
      throw new Error("Could not extract text from PPTX material.");
    }

    return await processExtractedText(extractedText, prompt);
  }

  return await processOriginalFile(material, prompt);
};
