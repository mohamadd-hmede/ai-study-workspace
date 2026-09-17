import type { GeneratedQuiz } from "@/types/quiz";

export type QuizAttempt = {
  id: string;
  materialId: string;
  courseId: string;
  quiz: GeneratedQuiz;
  selectedAnswers: Record<number, number>;
  score: number;
  totalQuestions: number;
  completedAt: number;
};
