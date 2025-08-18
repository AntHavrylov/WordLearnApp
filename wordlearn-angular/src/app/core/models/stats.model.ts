export interface WordStats {
  correct: number;
  incorrect: number;
}

export interface SessionHistory {
  date: string;
  score: number;
  total: number;
  percentage: number;
  timeSpent: number;
}

export interface AppStats {
  totalWords: number;
  quizzesTaken: number;
  averageScore: number;
  totalPercentageSum: number;
  studyTime: number;
  wordStats: { [key: string]: WordStats };
  sessionHistory: SessionHistory[];
}
