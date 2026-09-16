import { puter } from "@heyputer/puter.js";

import type { QuizAttempt } from "@/types/quiz-history";

const QUIZ_ATTEMPT_PREFIX = "quiz-attempt:";

const getQuizAttemptKey = (materialId: string, attemptId: string) => {
  return `${QUIZ_ATTEMPT_PREFIX}${materialId}:${attemptId}`;
};

export const saveQuizAttempt = async (attempt: QuizAttempt): Promise<void> => {
  await puter.kv.set(
    getQuizAttemptKey(attempt.materialId, attempt.id),
    attempt,
  );
};

export const getQuizAttemptsByMaterial = async (
  materialId: string,
): Promise<QuizAttempt[]> => {
  const records = await puter.kv.list({
    pattern: `${QUIZ_ATTEMPT_PREFIX}${materialId}:*`,
    returnValues: true,
  });

  return records
    .map((record) => record.value as QuizAttempt)
    .sort((a, b) => b.completedAt - a.completedAt);
};
