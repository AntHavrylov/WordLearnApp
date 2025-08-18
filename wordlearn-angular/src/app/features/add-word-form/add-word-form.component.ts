import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Word } from '../../core/models/word.model';
import { WordStorageService } from '../../core/services/word-storage.service';

@Component({
  selector: 'app-add-word-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-word-form.component.html',
  styleUrls: ['./add-word-form.component.css']
})
export class AddWordFormComponent implements OnInit {
  addWordForm!: FormGroup;
  isVisible = true;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  constructor(private fb: FormBuilder, private wordStorageService: WordStorageService) { }

  ngOnInit(): void {
    this.addWordForm = this.fb.group({
      article: [''],
      word: ['', [Validators.required, Validators.maxLength(50), Validators.pattern('[a-zA-Z0-9 ]+')]],
      translation: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  toggleForm(): void {
    this.isVisible = !this.isVisible;
  }

  onSubmit(): void {
    if (this.addWordForm.valid) {
      const newWord: Word = {
        ...this.addWordForm.value,
        learnStatus: 0
      };

      if (this.wordStorageService.saveWord(newWord)) {
        this.showMessage('Word added successfully!', 'success');
        this.addWordForm.reset({ article: '' });
      } else {
        this.showMessage('This word already exists.', 'error');
      }
    }
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 3000);
  }
}