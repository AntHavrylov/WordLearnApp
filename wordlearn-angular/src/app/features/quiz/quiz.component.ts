import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../core/services/quiz.service';
import { QuizWord, QuizResults } from '../../core/models/quiz.model';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent {
  currentWord: QuizWord | undefined;
  results: QuizResults | null = null;
  showDescription = false;
  selectedOption: string | null = null;
  selectedArticle: string | null = null;

  constructor(public quizService: QuizService) { }

  startQuiz(): void {
    if (this.quizService.initializeQuiz()) {
      this.results = null;
      this.updateCurrentWord();
    }
  }

  updateCurrentWord(): void {
    if (this.quizService.session) {
      this.currentWord = this.quizService.session.words[this.quizService.session.currentIndex];
      this.selectedOption = null;
      this.selectedArticle = null;
    }
  }

  selectOption(option: string): void {
    if (this.currentWord && this.currentWord.answer === null) {
      this.selectedOption = option;
    }
  }

  selectArticle(article: string): void {
    if (this.currentWord && this.currentWord.answer === null) {
      this.selectedArticle = article;
    }
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  next(): void {
    if (!this.quizService.session || !this.currentWord) return;

    if (this.currentWord.answer === null) {
      if (this.selectedOption) {
        this.quizService.handleAnswer(this.selectedOption, this.selectedArticle || undefined);
      }
    } else {
      this.quizService.nextCard();
      if (this.quizService.session.endTime) {
        this.results = this.quizService.endQuiz();
      } else {
        this.updateCurrentWord();
      }
    }
  }
}