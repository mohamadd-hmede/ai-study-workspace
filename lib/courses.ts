import puter from "@heyputer/puter.js";
import type { Course } from "@/types/course";

const COURSE_PREFIX = "course:";

const getCourseKey = (id: string) => {
  return `${COURSE_PREFIX}${id}`;
};

export const getCourses = async (): Promise<Course[]> => {
  const records = await puter.kv.list({
    pattern: `${COURSE_PREFIX}*`,
    returnValues: true,
  });

  return records
    .map((record) => record.value as Course)
    .sort((a, b) => a.createdAt - b.createdAt);
};

export const createCourse = async (
  title: string,
  description?: string,
): Promise<Course> => {
  const now = Date.now();

  const newCourse: Course = {
    id: crypto.randomUUID(),
    title,
    description,
    createdAt: now,
    updatedAt: now,
  };

  await puter.kv.set(getCourseKey(newCourse.id), newCourse);

  return newCourse;
};

export const updateCourse = async (
  id: string,
  title: string,
  description?: string,
): Promise<Course | null> => {
  const key = getCourseKey(id);

  const existingCourse = await puter.kv.get(key);

  if (!existingCourse) {
    return null;
  }

  const currentCourse = existingCourse as Course;

  const updatedCourse: Course = {
    ...currentCourse,
    title,
    description,
    updatedAt: Date.now(),
  };

  await puter.kv.set(key, updatedCourse);

  return updatedCourse;
};

export const deleteCourse = async (id: string): Promise<boolean> => {
  const key = getCourseKey(id);

  const existingCourse = await puter.kv.get(key);

  if (!existingCourse) {
    return false;
  }

  await puter.kv.del(key);

  return true;
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  const course = await puter.kv.get(getCourseKey(id));

  if (!course) {
    return null;
  }

  return course as Course;
};
