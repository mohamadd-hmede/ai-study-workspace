import { beforeEach, describe, expect, it, vi } from "vitest";
import puter from "@heyputer/puter.js";
import { deleteMaterial, getMaterialsByCourse } from "@/lib/materials";

vi.mock("@heyputer/puter.js", () => ({
  default: {
    kv: {
      list: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    },
  },
}));

vi.mock("@/lib/materials", () => ({
  getMaterialsByCourse: vi.fn(),
  deleteMaterial: vi.fn(),
}));

import { deleteCourse, getCourses, updateCourse } from "./courses";

describe("courses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("returns courses sorted from oldest to newest", async () => {
    const newerCourse = {
      id: "course-2",
      title: "Newer Course",
      createdAt: 2000,
      updatedAt: 2000,
    };

    const olderCourse = {
      id: "course-1",
      title: "Older Course",
      createdAt: 1000,
      updatedAt: 1000,
    };

    vi.mocked(puter.kv.list).mockResolvedValue([
      { key: "course:course-2", value: newerCourse },
      { key: "course:course-1", value: olderCourse },
    ]);

    const result = await getCourses();

    expect(result).toEqual([olderCourse, newerCourse]);
  });

  it("returns null when updating a course that does not exist", async () => {
    vi.mocked(puter.kv.get).mockResolvedValue(null);

    const result = await updateCourse(
      "missing-course",
      "Updated Course",
      "Updated description",
    );

    expect(result).toBeNull();
    expect(puter.kv.set).not.toHaveBeenCalled();
  });

  it("deletes course materials before deleting the course", async () => {
    const material = {
      id: "material-1",
      courseId: "course-1",
      name: "Test Material",
      originalFileName: "test.pdf",
      path: "/test.pdf",
      type: "application/pdf",
      size: 1000,
      createdAt: 1000,
    };

    vi.mocked(puter.kv.get).mockResolvedValue({
      id: "course-1",
      title: "Test Course",
      createdAt: 1000,
      updatedAt: 1000,
    });

    vi.mocked(getMaterialsByCourse).mockResolvedValue([material]);

    const result = await deleteCourse("course-1");

    expect(deleteMaterial).toHaveBeenCalledWith(material);
    expect(puter.kv.del).toHaveBeenCalledWith("course:course-1");
    expect(result).toBe(true);
  });
});
