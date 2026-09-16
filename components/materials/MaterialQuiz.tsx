"use client";

import { useState } from "react";

import { generateMaterialQuiz } from "@/lib/material-quiz";

import type { Material } from "@/types/material";
import type { GeneratedQuiz } from "@/types/quiz";

type MaterialQuizProps = {
  material: Material;
};

export default function MaterialQuiz({ material }: MaterialQuizProps) {
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    if (generatingQuiz) {
      return;
    }

    setGeneratingQuiz(true);
    setQuizError(null);

    try {
      const generatedQuiz = await generateMaterialQuiz(material);

      setQuiz(generatedQuiz);
    } catch (error) {
      console.error("Quiz generation error:", error);

      setQuizError("Failed to generate quiz. Please try again.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Quiz</h2>

          <p className="mt-1 text-sm text-gray-500">
            Generate a quiz from this study material.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateQuiz}
          disabled={generatingQuiz}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generatingQuiz ? "Generating..." : "Generate Quiz"}
        </button>
      </div>

      {quizError && <p className="mt-4 text-sm text-red-600">{quizError}</p>}

      {quiz && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>

          <div className="mt-4 space-y-6">
            {quiz.questions.map((question, questionIndex) => (
              <div
                key={question.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <p className="font-medium text-gray-900">
                  {questionIndex + 1}. {question.question}
                </p>

                <ol className="mt-3 list-[upper-alpha] space-y-1 pl-6 text-sm text-gray-700">
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex}>{option}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
