import { puter } from "@heyputer/puter.js";

import type { Material } from "@/types/material";

import {
  detectMaterialFileCapability,
  getMaterialFileCapability,
} from "@/lib/material-file-capabilities";

const MATERIAL_PREFIX = "material:";

const getMaterialKey = (courseId: string, id: string) => {
  return `${MATERIAL_PREFIX}${courseId}:${id}`;
};

const normalizeMaterial = (material: Material): Material => {
  if (material.capability && material.originalFileName) {
    return material;
  }

  const originalFileName = material.originalFileName || material.name;

  const capability =
    material.capability ||
    getMaterialFileCapability(originalFileName, material.type);

  if (!capability) {
    throw new Error(
      `StudyFlow could not determine the capabilities of "${material.name}".`,
    );
  }

  return {
    ...material,
    originalFileName,
    capability,
  };
};

export const uploadMaterialFile = async (
  courseId: string,
  file: File,
  onProgress?: (progress: number) => void,
) => {
  const path = `study-materials/${courseId}/${crypto.randomUUID()}-${file.name}`;

  const uploadedFile = await puter.fs.write(path, file, {
    createMissingParents: true,

    progress: (_operationId, progress) => {
      onProgress?.(progress);
    },
  });

  return uploadedFile;
};

export const createMaterial = async (
  courseId: string,
  file: File,
  name?: string,
  onProgress?: (progress: number) => void,
): Promise<Material> => {
  const capability = await detectMaterialFileCapability(file);

  if (!capability) {
    throw new Error(
      "This file type is not supported because StudyFlow cannot safely read and preview it.",
    );
  }

  const uploadedFile = await uploadMaterialFile(courseId, file, onProgress);

  const material: Material = {
    id: crypto.randomUUID(),
    courseId,
    name: name?.trim() || file.name,
    originalFileName: file.name,
    path: uploadedFile.path,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
    capability,
  };

  try {
    await puter.kv.set(
      getMaterialKey(material.courseId, material.id),
      material,
    );

    return material;
  } catch (error) {
    await puter.fs.delete(uploadedFile.path);
    throw error;
  }
};

export const renameMaterial = async (
  material: Material,
  newName: string,
): Promise<Material> => {
  const trimmedName = newName.trim();

  if (!trimmedName) {
    throw new Error("Material name cannot be empty.");
  }

  const normalizedMaterial = normalizeMaterial(material);

  const updatedMaterial: Material = {
    ...normalizedMaterial,
    name: trimmedName,
  };

  await puter.kv.set(
    getMaterialKey(updatedMaterial.courseId, updatedMaterial.id),
    updatedMaterial,
  );

  return updatedMaterial;
};

export const getMaterialsByCourse = async (
  courseId: string,
): Promise<Material[]> => {
  const records = await puter.kv.list({
    pattern: `${MATERIAL_PREFIX}${courseId}:*`,
    returnValues: true,
  });

  return records
    .map((record) => normalizeMaterial(record.value as Material))
    .sort((a, b) => a.createdAt - b.createdAt);
};

export const getMaterialById = async (
  courseId: string,
  materialId: string,
): Promise<Material | null> => {
  const material = await puter.kv.get(getMaterialKey(courseId, materialId));

  if (!material) {
    return null;
  }

  return normalizeMaterial(material as Material);
};

export const deleteMaterial = async (material: Material): Promise<boolean> => {
  const key = getMaterialKey(material.courseId, material.id);

  const existingMaterial = await puter.kv.get(key);

  if (!existingMaterial) {
    return false;
  }

  const storedMaterial = existingMaterial as Material;

  try {
    await puter.fs.delete(storedMaterial.path);
  } catch (error) {
    console.warn(
      "Material file could not be deleted. It may already be missing:",
      error,
    );
  }

  await puter.kv.del(key);

  return true;
};
