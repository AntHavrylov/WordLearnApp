export interface Word {
  word: string;
  translation: string;
  description: string;
  article: 'der' | 'die' | 'das' | '';
  learnStatus: number;
}
