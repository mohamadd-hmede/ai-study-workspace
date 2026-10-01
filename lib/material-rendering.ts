import { puter } from "@heyputer/puter.js";

import type { Material } from "@/types/material";

export type RenderedMaterialPage = {
  index: number;
  image: Blob;
};

type RenderResponse = {
  pages?: {
    index: number;
    mimeType: string;
    base64: string;
  }[];
  error?: string;
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], {
    type: mimeType,
  });
};

export const renderMaterialPages = async (
  material: Material,
): Promise<RenderedMaterialPage[]> => {
  const storedFile = await puter.fs.read(material.path);

  const file = new File(
    [storedFile],
    material.originalFileName || material.name,
    {
      type: material.type,
    },
  );

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/materials/render", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as RenderResponse;

  if (!response.ok) {
    throw new Error(data.error || "StudyFlow could not render this material.");
  }

  if (!data.pages || data.pages.length === 0) {
    throw new Error("StudyFlow could not produce any rendered pages.");
  }

  return data.pages.map((page) => ({
    index: page.index,
    image: base64ToBlob(page.base64, page.mimeType),
  }));
};
