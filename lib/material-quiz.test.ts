import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Material } from "@/types/material";
import { processMaterial } from "@/lib/material-processing";
import { generateMaterialQuiz } from "./material-quiz";

vi.mock("@/lib/material-processing", () => ({
  processMaterial: vi.fn(),
}));

const mockMaterial: Material = {
  id: "material-1",
  courseId: "course-1",
  name: "Test Material",
  originalFileName: "test.pdf",
  path: "/test.pdf",
  type: "application/pdf",
  size: 1000,
  createdAt: 123456789,
};

const validQuiz = {
  title: "Test Quiz",
  questions: Array.from({ length: 10 }, (_, index) => ({
    id: String(index + 1),
    question: `Question ${index + 1}`,
    options: ["A", "B", "C", "D"],
    correctAnswer: 0,
    explanation: "Test explanation",
  })),
};

describe("generateMaterialQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a valid quiz generated from the material", async () => {
    vi.mocked(processMaterial).mockResolvedValue(JSON.stringify(validQuiz));

    const result = await generateMaterialQuiz(mockMaterial);

    expect(result).toEqual(validQuiz);
    expect(processMaterial).toHaveBeenCalledOnce();
  });
  it("retries when the first AI response is invalid", async () => {
    vi.mocked(processMaterial)
      .mockResolvedValueOnce("invalid response")
      .mockResolvedValueOnce(JSON.stringify(validQuiz));

    const result = await generateMaterialQuiz(mockMaterial);

    expect(result).toEqual(validQuiz);
    expect(processMaterial).toHaveBeenCalledTimes(2);
  });

  it("throws an error when both AI responses are invalid", async () => {
    vi.mocked(processMaterial)
      .mockResolvedValueOnce("invalid response")
      .mockResolvedValueOnce("still invalid");

    await expect(generateMaterialQuiz(mockMaterial)).rejects.toThrow(
      "AI returned an invalid quiz after multiple generation attempts.",
    );

    expect(processMaterial).toHaveBeenCalledTimes(2);
  });
});
