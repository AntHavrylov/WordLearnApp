import { Injectable } from '@angular/core';
import { Word } from '../models/word.model';
import { WordStorageService } from './word-storage.service';
import { QuizSession, QuizWord, QuizResults } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  session: QuizSession | null = null;

  constructor(private wordStorageService: WordStorageService) { }

  initializeQuiz(wordCount = 10): boolean {
    const allWords = this.wordStorageService.getWords();
    if (allWords.length < 4) {
      return false;
    }

    const wordsForQuiz = this.shuffleArray(allWords).slice(0, wordCount);

    this.session = {
      words: wordsForQuiz.map(w => {
        const isReverse = (w.learnStatus || 0) >= 3;
        const correctAnswer = isReverse ? w.word : w.translation;
        const distractors = this.generateDistractors(correctAnswer, allWords, isReverse ? 'word' : 'translation');
        const options = this.shuffleArray([correctAnswer, ...distractors]);
        return { ...w, answer: null, selected: null, options: options, isReverse: isReverse, correctArticle: w.article, selectedArticle: null };
      }),
      currentIndex: 0,
      score: 0,
      totalQuestions: wordsForQuiz.length,
      startTime: new Date(),
      endTime: null
    };

    return true;
  }

  private generateDistractors(correctAnswer: string, wordPool: Word[], type: 'word' | 'translation'): string[] {
    const distractors: string[] = [];
    const field = type === 'word' ? 'word' : 'translation';
    const pool = this.shuffleArray(wordPool.filter(w => w[field] !== correctAnswer));
    while (distractors.length < 3 && pool.length > 0) {
        const distractor = pool.pop();
        if(distractor) {
            distractors.push(distractor[field]);
        }
    }
    return distractors;
  }

  handleAnswer(selectedOption: string, selectedArticle?: string): void {
    if (!this.session) return;

    const currentWord = this.session.words[this.session.currentIndex];
    currentWord.selected = selectedOption;

    let isCorrectWord = false;
    let isCorrectArticle = true;

    if (currentWord.isReverse) {
      isCorrectWord = selectedOption === currentWord.word;
      isCorrectArticle = currentWord.correctArticle === '' || selectedArticle === currentWord.correctArticle;
      currentWord.answer = isCorrectWord && isCorrectArticle;
      currentWord.selectedArticle = selectedArticle || null;
    } else {
      isCorrectWord = selectedOption === currentWord.translation;
      currentWord.answer = isCorrectWord;
    }
  }

  nextCard(): void {
    if (!this.session) return;
    if (this.session.currentIndex < this.session.totalQuestions - 1) {
      this.session.currentIndex++;
    } else {
      this.endQuiz();
    }
  }

  previousCard(): void {
    if (!this.session) return;
    if (this.session.currentIndex > 0) {
      this.session.currentIndex--;
    }
  }

  endQuiz(): QuizResults | null {
    if (!this.session) return null;

    this.session.endTime = new Date();
    const correctAnswers = this.session.words.filter(w => w.answer === true);
    const incorrectAnswers = this.session.words.filter(w => w.answer === false);
    const score = correctAnswers.length;
    const percentage = this.calculateScore(score, this.session.totalQuestions);
    const timeSpent = (this.session.endTime.getTime() - this.session.startTime.getTime()) / 1000;

    // Update learnStatus
    const allWords = this.wordStorageService.getWords();
    correctAnswers.forEach(answeredWord => {
      const wordToUpdate = allWords.find(w => w.word === answeredWord.word);
      if (wordToUpdate) {
        wordToUpdate.learnStatus = Math.min(7, (wordToUpdate.learnStatus || 0) + 1);
      }
    });
    incorrectAnswers.forEach(answeredWord => {
      const wordToUpdate = allWords.find(w => w.word === answeredWord.word);
      if (wordToUpdate) {
        wordToUpdate.learnStatus = Math.max(0, (wordToUpdate.learnStatus || 0) - 1);
      }
    });
    this.wordStorageService.clearAllWords();
    allWords.forEach(w => this.wordStorageService.saveWord(w));

    const results: QuizResults = {
      score,
      percentage,
      totalQuestions: this.session.totalQuestions,
      timeSpent,
      correctAnswers,
      incorrectAnswers
    };

    return results;
  }

  private calculateScore(correct: number, total: number): number {
    if (total === 0) return 0;
    return parseFloat(((correct / total) * 100).toFixed(2));
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}