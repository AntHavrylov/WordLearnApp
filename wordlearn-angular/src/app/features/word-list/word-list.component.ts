import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Word } from '../../core/models/word.model';
import { WordStorageService } from '../../core/services/word-storage.service';

@Component({
  selector: 'app-word-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-list.component.html',
  styleUrls: ['./word-list.component.css']
})
export class WordListComponent implements OnInit {
  words: Word[] = [];
  filteredWords: Word[] = [];
  searchTerm = '';
  isVisible = true;
  viewMode: 'list' | 'grid' = 'list';

  constructor(private wordStorageService: WordStorageService) { }

  ngOnInit(): void {
    this.loadWords();
  }

  loadWords(): void {
    this.words = this.wordStorageService.getWords();
    this.filterWords();
  }

  filterWords(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredWords = this.words.filter(word =>
      word.word.toLowerCase().includes(term) ||
      word.translation.toLowerCase().includes(term)
    );
  }

  deleteWord(wordId: string): void {
    if (confirm(`Are you sure you want to delete "${wordId}"?`)) {
      this.wordStorageService.deleteWord(wordId);
      this.loadWords();
    }
  }

  toggleList(): void {
    this.isVisible = !this.isVisible;
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }
}