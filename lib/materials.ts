import { puter } from "@heyputer/puter.js";
import type { Material } from "@/types/material";

const MATERIAL_PREFIX = "material:";

const getMaterialKey = (courseId: string, id: string) => {
  return `${MATERIAL_PREFIX}${courseId}:${id}`;
};

export const uploadMaterialFile = async (courseId: string, file: File) => {
  const path = `study-materials/${courseId}/${crypto.randomUUID()}-${file.name}`;

  const uploadedFile = await puter.fs.write(path, file, {
    createMissingParents: true,
  });

  return uploadedFile;
};

export const createMaterial = async (
  courseId: string,
  file: File,
): Promise<Material> => {
  const uploadedFile = await uploadMaterialFile(courseId, file);

  const material: Material = {
    id: crypto.randomUUID(),
    courseId,
    name: file.name,
    path: uploadedFile.path,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
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

export const getMaterialsByCourse = async (
  courseId: string,
): Promise<Material[]> => {
  const records = await puter.kv.list({
    pattern: `${MATERIAL_PREFIX}${courseId}:*`,
    returnValues: true,
  });

  return records
    .map((record) => record.value as Material)
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

  return material as Material;
};

export const deleteMaterial = async (material: Material): Promise<boolean> => {
  const key = getMaterialKey(material.courseId, material.id);

  const existingMaterial = await puter.kv.get(key);

  if (!existingMaterial) {
    return false;
  }

  await puter.kv.del(key);

  try {
    await puter.fs.delete(material.path);
  } catch (error) {
    await puter.kv.set(key, existingMaterial);
    throw error;
  }

  return true;
};
