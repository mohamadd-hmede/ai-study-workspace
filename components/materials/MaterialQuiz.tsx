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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleGenerateQuiz = async () => {
    if (generatingQuiz) {
      return;
    }

    setGeneratingQuiz(true);
    setQuizError(null);

    try {
      const generatedQuiz = await generateMaterialQuiz(material);

      setQuiz(generatedQuiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizSubmitted(false);
    } catch (error) {
      console.error("Quiz generation error:", error);

      setQuizError("Failed to generate quiz. Please try again.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = () => {
    if (!quiz) {
      return;
    }

    if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
      return;
    }

    setQuizSubmitted(true);
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

          {quizSubmitted ? (
            <div className="mt-6 rounded-lg border border-gray-200 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Quiz Completed
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                You have answered all {quiz.questions.length} questions.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>

              <div className="mt-3 rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">
                  {quiz.questions[currentQuestionIndex].question}
                </p>

                <div className="mt-4 space-y-2">
                  {quiz.questions[currentQuestionIndex].options.map(
                    (option, optionIndex) => {
                      const isSelected =
                        selectedAnswers[currentQuestionIndex] === optionIndex;

                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          onClick={() =>
                            setSelectedAnswers((previousAnswers) => ({
                              ...previousAnswers,
                              [currentQuestionIndex]: optionIndex,
                            }))
                          }
                          className={`block w-full rounded-lg border p-3 text-left text-sm ${
                            isSelected
                              ? "border-black bg-gray-100"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </button>
                      );
                    },
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestionIndex(
                        (previousIndex) => previousIndex - 1,
                      )
                    }
                    disabled={currentQuestionIndex === 0}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      disabled={
                        selectedAnswers[currentQuestionIndex] === undefined
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentQuestionIndex(
                          (previousIndex) => previousIndex + 1,
                        )
                      }
                      disabled={
                        selectedAnswers[currentQuestionIndex] === undefined
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
