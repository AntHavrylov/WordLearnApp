import { Word } from './word.model';

export interface QuizWord extends Word {
  answer: boolean | null;
  selected: string | null;
  options: string[];
  isReverse: boolean;
  correctArticle: string;
  selectedArticle: string | null;
}

export interface QuizSession {
  words: QuizWord[];
  currentIndex: number;
  score: number;
  totalQuestions: number;
  startTime: Date;
  endTime: Date | null;
}

export interface QuizResults {
  score: number;
  percentage: number;
  totalQuestions: number;
  timeSpent: number;
  correctAnswers: QuizWord[];
  incorrectAnswers: QuizWord[];
}
