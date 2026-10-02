import { beforeEach, describe, expect, it, vi } from "vitest";
import { puter } from "@heyputer/puter.js";

import type { QuizAttempt } from "@/types/quiz-history";
import { getQuizAttemptsByMaterial, saveQuizAttempt } from "./quiz-history";

vi.mock("@heyputer/puter.js", () => ({
  puter: {
    kv: {
      set: vi.fn(),
      list: vi.fn(),
    },
  },
}));

const mockAttempt: QuizAttempt = {
  id: "attempt-1",
  materialId: "material-1",
  courseId: "course-1",
  quiz: {
    title: "Test Quiz",
    questions: Array.from({ length: 10 }, (_, index) => ({
      id: String(index + 1),
      question: `Question ${index + 1}`,
      options: ["A", "B", "C", "D"],
      correctAnswer: 0,
      explanation: "Test explanation",
    })),
  },
  selectedAnswers: {
    0: 0,
  },
  score: 1,
  totalQuestions: 10,
  completedAt: 1000,
};

describe("quiz history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a quiz attempt using the material and attempt IDs", async () => {
    await saveQuizAttempt(mockAttempt);

    expect(puter.kv.set).toHaveBeenCalledWith(
      "quiz-attempt:material-1:attempt-1",
      mockAttempt,
    );
  });

  it("returns quiz attempts sorted from newest to oldest", async () => {
    const olderAttempt = {
      ...mockAttempt,
      id: "attempt-old",
      completedAt: 1000,
    };

    const newerAttempt = {
      ...mockAttempt,
      id: "attempt-new",
      completedAt: 3000,
    };

    vi.mocked(puter.kv.list).mockResolvedValue([
      { key: "old", value: olderAttempt },
      { key: "new", value: newerAttempt },
    ]);

    const result = await getQuizAttemptsByMaterial("material-1");

    expect(result).toEqual([newerAttempt, olderAttempt]);
  });
});
