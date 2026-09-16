"use client";

import { useEffect, useState } from "react";

import { generateMaterialQuiz } from "@/lib/material-quiz";

import type { Material } from "@/types/material";
import type { GeneratedQuiz } from "@/types/quiz";

import { getQuizAttemptsByMaterial, saveQuizAttempt } from "@/lib/quiz-history";
import type { QuizAttempt } from "@/types/quiz-history";

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
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [selectedHistoryAttempt, setSelectedHistoryAttempt] =
    useState<QuizAttempt | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadQuizHistory = async () => {
      try {
        const attempts = await getQuizAttemptsByMaterial(material.id);

        if (isActive) {
          setQuizHistory(attempts);
        }
      } catch (error) {
        console.error("Failed to load quiz history:", error);
      }
    };

    loadQuizHistory();

    return () => {
      isActive = false;
    };
  }, [material.id]);

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

  const calculateScore = () => {
    if (!quiz) {
      return 0;
    }

    return quiz.questions.reduce((score, question, questionIndex) => {
      const selectedAnswer = selectedAnswers[questionIndex];

      if (selectedAnswer === question.correctAnswer) {
        return score + 1;
      }

      return score;
    }, 0);
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) {
      return;
    }

    if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
      return;
    }

    const score = calculateScore();

    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      materialId: material.id,
      courseId: material.courseId,
      quiz,
      selectedAnswers,
      score,
      totalQuestions: quiz.questions.length,
      completedAt: Date.now(),
    };

    await saveQuizAttempt(attempt);

    setQuizHistory((previousHistory) => [attempt, ...previousHistory]);

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

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {calculateScore()} / {quiz.questions.length}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                You scored{" "}
                {Math.round((calculateScore() / quiz.questions.length) * 100)}
                %.
              </p>

              <div className="mt-6 space-y-4 text-left">
                {quiz.questions.map((question, questionIndex) => {
                  const selectedAnswer = selectedAnswers[questionIndex];
                  const isCorrect = selectedAnswer === question.correctAnswer;

                  return (
                    <div
                      key={question.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <p className="font-medium text-gray-900">
                        {questionIndex + 1}. {question.question}
                      </p>

                      <p
                        className={`mt-2 text-sm font-medium ${
                          isCorrect ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Incorrect"}
                      </p>

                      <p className="mt-2 text-sm text-gray-700">
                        Your answer: {question.options[selectedAnswer]}
                      </p>

                      {!isCorrect && (
                        <p className="mt-1 text-sm text-gray-700">
                          Correct answer:{" "}
                          {question.options[question.correctAnswer]}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-gray-600">
                        {question.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
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
                          aria-pressed={isSelected}
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
      {quizHistory.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Quiz History</h3>

          <p className="mt-1 text-sm text-gray-500">
            Your previous attempts for this material.
          </p>

          <div className="mt-4 space-y-3">
            {quizHistory.map((attempt) => {
              const percentage = Math.round(
                (attempt.score / attempt.totalQuestions) * 100,
              );

              return (
                <button
                  key={attempt.id}
                  type="button"
                  onClick={() => setSelectedHistoryAttempt(attempt)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {attempt.quiz.title}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(attempt.completedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {attempt.score} / {attempt.totalQuestions}
                    </p>

                    <p className="text-sm text-gray-500">{percentage}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {selectedHistoryAttempt && (
        <div className="mt-6 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Previous Quiz Result
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {new Date(selectedHistoryAttempt.completedAt).toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedHistoryAttempt(null)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            >
              Close
            </button>
          </div>

          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              {selectedHistoryAttempt.score} /{" "}
              {selectedHistoryAttempt.totalQuestions}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {Math.round(
                (selectedHistoryAttempt.score /
                  selectedHistoryAttempt.totalQuestions) *
                  100,
              )}
              %
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {selectedHistoryAttempt.quiz.questions.map(
              (question, questionIndex) => {
                const selectedAnswer =
                  selectedHistoryAttempt.selectedAnswers[questionIndex];

                const isCorrect = selectedAnswer === question.correctAnswer;

                return (
                  <div
                    key={question.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <p className="font-medium text-gray-900">
                      {questionIndex + 1}. {question.question}
                    </p>

                    <p
                      className={`mt-2 text-sm font-medium ${
                        isCorrect ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </p>

                    <p className="mt-2 text-sm text-gray-700">
                      Your answer: {question.options[selectedAnswer]}
                    </p>

                    {!isCorrect && (
                      <p className="mt-1 text-sm text-gray-700">
                        Correct answer:{" "}
                        {question.options[question.correctAnswer]}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-gray-600">
                      {question.explanation}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}
