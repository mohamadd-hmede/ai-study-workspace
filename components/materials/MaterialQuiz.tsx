"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  RefreshCw,
  X,
} from "lucide-react";

import { generateMaterialQuiz } from "@/lib/material-quiz";
import { getQuizAttemptsByMaterial, saveQuizAttempt } from "@/lib/quiz-history";

import type { Material } from "@/types/material";
import type { GeneratedQuiz } from "@/types/quiz";
import type { QuizAttempt } from "@/types/quiz-history";

type MaterialQuizProps = {
  material: Material;
  initialGeneration?: boolean;
};

export default function MaterialQuiz({
  material,
  initialGeneration = false,
}: MaterialQuizProps) {
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(initialGeneration);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistoryAttempt, setSelectedHistoryAttempt] =
    useState<QuizAttempt | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showEndQuizModal, setShowEndQuizModal] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadQuizHistory = async () => {
      setHistoryLoading(true);

      try {
        const attempts = await getQuizAttemptsByMaterial(material.id);

        if (isActive) {
          setSelectedHistoryAttempt(null);
          setQuizHistory(attempts);
        }
      } catch (error) {
        console.error("Failed to load quiz history:", error);

        if (isActive) {
          setSelectedHistoryAttempt(null);
          setQuizHistory([]);
        }
      } finally {
        if (isActive) {
          setHistoryLoading(false);
        }
      }
    };

    void loadQuizHistory();

    return () => {
      isActive = false;
    };
  }, [material.id]);

  useEffect(() => {
    if (!initialGeneration) {
      return;
    }

    let isActive = true;

    const generateInitialQuiz = async () => {
      try {
        const generatedQuiz = await generateMaterialQuiz(material);

        if (isActive) {
          setQuiz(generatedQuiz);
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
          setQuizSubmitted(false);
          setSelectedHistoryAttempt(null);
        }
      } catch (error) {
        console.error("Quiz generation error:", error);

        if (isActive) {
          setQuizError("Failed to generate quiz. Please try again.");
        }
      } finally {
        if (isActive) {
          setGeneratingQuiz(false);
        }
      }
    };

    void generateInitialQuiz();

    return () => {
      isActive = false;
    };
  }, [initialGeneration, material]);

  const handleGenerateQuiz = async () => {
    if (generatingQuiz) {
      return;
    }

    setGeneratingQuiz(true);
    setQuizError(null);
    setSelectedHistoryAttempt(null);

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

  const handleEndQuiz = () => {
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizError(null);
    setSelectedHistoryAttempt(null);
    setShowEndQuizModal(false);
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
    if (!quiz || submittingQuiz) {
      return;
    }

    if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
      return;
    }

    setSubmittingQuiz(true);
    setQuizError(null);

    try {
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
    } catch (error) {
      console.error("Failed to save quiz attempt:", error);
      setQuizError("Failed to save your quiz result. Please try again.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const renderAttemptReview = (
    attemptQuiz: GeneratedQuiz,
    answers: Record<number, number>,
  ) => {
    return (
      <div className="mt-6 space-y-4 text-left">
        {attemptQuiz.questions.map((question, questionIndex) => {
          const selectedAnswer = answers[questionIndex];
          const isCorrect = selectedAnswer === question.correctAnswer;

          return (
            <div
              key={question.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="font-semibold leading-6 text-slate-900">
                {questionIndex + 1}. {question.question}
              </p>

              <div className="mt-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isCorrect
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-700">
                <span className="font-medium">Your answer:</span>{" "}
                {question.options[selectedAnswer]}
              </p>

              {!isCorrect && (
                <p className="mt-1.5 text-sm text-slate-700">
                  <span className="font-medium">Correct answer:</span>{" "}
                  {question.options[question.correctAnswer]}
                </p>
              )}

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {question.explanation}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHistory = () => {
    if (historyLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </div>
      );
    }

    if (quizHistory.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="font-medium text-slate-700">No quiz attempts yet</p>

          <p className="mt-1 text-sm text-slate-500">
            Complete a quiz and your results will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-2">
        {quizHistory.map((attempt) => {
          const percentage = Math.round(
            (attempt.score / attempt.totalQuestions) * 100,
          );

          return (
            <button
              key={attempt.id}
              type="button"
              onClick={() => setSelectedHistoryAttempt(attempt)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {attempt.quiz.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {new Date(attempt.completedAt).toLocaleString()}
                </p>
              </div>

              <div className="ml-4 shrink-0 text-right">
                <p className="font-semibold text-slate-900">
                  {attempt.score} / {attempt.totalQuestions}
                </p>

                <p className="text-sm text-slate-500">{percentage}%</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderSelectedHistoryAttempt = () => {
    if (!selectedHistoryAttempt) {
      return null;
    }

    return (
      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Previous Quiz Result
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {new Date(selectedHistoryAttempt.completedAt).toLocaleString()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedHistoryAttempt(null)}
            className="self-start rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:self-auto"
          >
            Close
          </button>
        </div>

        <p className="mt-5 text-3xl font-bold text-slate-950">
          {selectedHistoryAttempt.score} /{" "}
          {selectedHistoryAttempt.totalQuestions}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {Math.round(
            (selectedHistoryAttempt.score /
              selectedHistoryAttempt.totalQuestions) *
              100,
          )}
          %
        </p>

        {renderAttemptReview(
          selectedHistoryAttempt.quiz,
          selectedHistoryAttempt.selectedAnswers,
        )}
      </div>
    );
  };

  if (!quiz) {
    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {generatingQuiz ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <ListChecks className="h-6 w-6 text-blue-600" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Generating Quiz...
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              AI is analyzing {material.name} and preparing questions for you.
            </p>

            <div className="mt-5 h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <ListChecks className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Quiz History
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Previous quiz attempts for {material.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQuiz}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:self-auto"
                >
                  <ListChecks className="h-4 w-4" />
                  Start New Quiz
                </button>
              </div>

              {quizError && (
                <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {quizError}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              {renderHistory()}
              {renderSelectedHistoryAttempt()}
            </div>
          </>
        )}
      </section>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const progressPercentage = Math.round(
    ((currentQuestionIndex + 1) / quiz.questions.length) * 100,
  );

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <ListChecks className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">Quiz</h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Based on {material.name}
                </p>
              </div>
            </div>

            {!quizSubmitted && (
              <button
                type="button"
                onClick={() => setShowEndQuizModal(true)}
                disabled={submittingQuiz}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <X className="h-4 w-4" />
                End Quiz
              </button>
            )}
          </div>

          {quizError && (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {quizError}
            </div>
          )}

          {quizSubmitted ? (
            <div className="py-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-6 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <ListChecks className="h-6 w-6 text-blue-600" />
                </div>

                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  Quiz Completed
                </h3>

                <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
                  {calculateScore()} / {quiz.questions.length}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  You scored{" "}
                  {Math.round((calculateScore() / quiz.questions.length) * 100)}
                  %.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        generatingQuiz ? "animate-spin" : ""
                      }`}
                    />

                    {generatingQuiz ? "Generating..." : "Take New Quiz"}
                  </button>

                  <button
                    type="button"
                    onClick={handleEndQuiz}
                    disabled={generatingQuiz}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    View Quiz History
                  </button>
                </div>
              </div>

              {renderAttemptReview(quiz, selectedAnswers)}
            </div>
          ) : (
            <div className="py-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-700">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>

                <p className="text-sm font-medium text-slate-500">
                  {progressPercentage}%
                </p>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="mt-7">
                <h3 className="text-lg font-semibold leading-7 text-slate-900 sm:text-xl">
                  {currentQuestion.question}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Select one answer.
                </p>

                <div className="mt-6 space-y-3">
                  {currentQuestion.options.map((option, optionIndex) => {
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
                        className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition sm:px-5 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 text-blue-950"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/30"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-blue-600" : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="h-3 w-3 rounded-full bg-blue-600" />
                          )}
                        </span>

                        <span className="text-sm font-medium sm:text-base">
                          <span className="mr-2 font-semibold">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIndex(
                      (previousIndex) => previousIndex - 1,
                    )
                  }
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={
                      selectedAnswers[currentQuestionIndex] === undefined ||
                      submittingQuiz
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {submittingQuiz ? "Submitting..." : "Submit Quiz"}
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
                      selectedAnswers[currentQuestionIndex] === undefined ||
                      submittingQuiz
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {quizHistory.length > 0 && !quizSubmitted && (
          <div className="border-t border-slate-200 bg-slate-50/40 p-5 sm:p-6 lg:px-8">
            <h3 className="text-lg font-semibold text-slate-900">
              Quiz History
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your previous attempts for this material.
            </p>

            <div className="mt-4">{renderHistory()}</div>
          </div>
        )}
      </section>

      {showEndQuizModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-quiz-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="end-quiz-title"
                  className="text-lg font-semibold text-slate-950"
                >
                  End this quiz?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your current answers will be discarded and this attempt
                  won&apos;t be saved.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEndQuizModal(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowEndQuizModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Continue Quiz
              </button>

              <button
                type="button"
                onClick={handleEndQuiz}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                End Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
