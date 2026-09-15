import type { Material } from "@/types/material";
import type { GeneratedQuiz } from "@/types/quiz";

import { processMaterial } from "@/lib/material-processing";

const isValidQuiz = (value: unknown): value is GeneratedQuiz => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const quiz = value as GeneratedQuiz;

  if (
    typeof quiz.title !== "string" ||
    !Array.isArray(quiz.questions) ||
    quiz.questions.length === 0
  ) {
    return false;
  }

  return quiz.questions.every(
    (question) =>
      typeof question.id === "string" &&
      typeof question.question === "string" &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.options.every((option) => typeof option === "string") &&
      Number.isInteger(question.correctAnswer) &&
      question.correctAnswer >= 0 &&
      question.correctAnswer <= 3 &&
      typeof question.explanation === "string",
  );
};

export const generateMaterialQuiz = async (
  material: Material,
): Promise<GeneratedQuiz> => {
  const prompt = `
You are an AI study assistant.

Create a multiple-choice quiz using only the provided study material.

Return ONLY valid JSON.
Do not include Markdown.
Do not include code fences.
Do not include any text before or after the JSON.

Use exactly this structure:

{
  "title": "Quiz title",
  "questions": [
    {
      "id": "1",
      "question": "Question text",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation of why the answer is correct."
    }
  ]
}

Rules:
- Generate 10 questions
- Each question must have exactly 4 options
- Only one option must be correct
- correctAnswer must be the zero-based index of the correct option: 0, 1, 2, or 3
- Questions should test important concepts from the material
- Include a mix of straightforward and understanding-based questions
- Avoid duplicate questions
- Keep questions and options clear and concise
- Give a short explanation for every correct answer
- Use only information found in the study material
- Do not invent information
`;

  const response = await processMaterial(material, prompt);

  const quiz: unknown = JSON.parse(response);

  if (!isValidQuiz(quiz)) {
    throw new Error("AI returned an invalid quiz.");
  }

  return quiz;
};
