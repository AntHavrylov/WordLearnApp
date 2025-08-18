import { Component } from '@angular/core';
import { AddWordFormComponent } from './features/add-word-form/add-word-form.component';
import { WordListComponent } from './features/word-list/word-list.component';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { QuizComponent } from './features/quiz/quiz.component';
import { StatsComponent } from './features/stats/stats.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AddWordFormComponent, WordListComponent, HeaderComponent, FooterComponent, QuizComponent, StatsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'wordlearn-angular';
}