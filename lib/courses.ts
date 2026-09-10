import puter from "@heyputer/puter.js";
import type { Course } from "@/types/course";

const COURSES_KEY = "courses";

export const getCourses = async (): Promise<Course[]> => {
  try {
    const courses = await puter.kv.get(COURSES_KEY);

    if (!courses) {
      return [];
    }

    return courses as Course[];
  } catch (error) {
    console.error("Failed to get courses:", error);
    return [];
  }
};

export const createCourse = async (
  title: string,
  description?: string,
): Promise<Course> => {
  const courses = await getCourses();

  const now = Date.now();

  const newCourse: Course = {
    id: crypto.randomUUID(),
    title,
    description,
    createdAt: now,
    updatedAt: now,
  };

  await puter.kv.set(COURSES_KEY, [...courses, newCourse]);

  return newCourse;
};

export const updateCourse = async (
  id: string,
  title: string,
  description?: string,
): Promise<Course | null> => {
  const courses = await getCourses();

  const courseIndex = courses.findIndex((course) => course.id === id);

  if (courseIndex === -1) {
    return null;
  }

  const updatedCourse: Course = {
    ...courses[courseIndex],
    title,
    description,
    updatedAt: Date.now(),
  };

  courses[courseIndex] = updatedCourse;

  await puter.kv.set(COURSES_KEY, courses);

  return updatedCourse;
};

export const deleteCourse = async (id: string): Promise<boolean> => {
  const courses = await getCourses();

  const updatedCourses = courses.filter((course) => course.id !== id);

  if (updatedCourses.length === courses.length) {
    return false;
  }

  await puter.kv.set(COURSES_KEY, updatedCourses);

  return true;
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  const courses = await getCourses();

  const course = courses.find((course) => course.id === id);

  return course ?? null;
};
