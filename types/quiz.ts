export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export type GeneratedQuiz = {
  title: string;
  questions: QuizQuestion[];
};
