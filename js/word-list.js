class WordList {
    static init() {
        this.container = document.getElementById('word-list-container');
        this.counter = document.getElementById('word-counter');
        this.searchBox = document.getElementById('search-box');
        this.viewToggle = document.getElementById('view-toggle');

        this.searchBox.addEventListener('input', () => this.render());
        this.viewToggle.addEventListener('click', () => this.toggleView());

        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const wordId = e.target.closest('.word-item').dataset.id;
                if (confirm(`Are you sure you want to delete "${wordId}"?`)) {
                    Storage.deleteWord(wordId);
                    this.render();
                    Quiz.displayWords(); // Update quiz section as well
                }
            }
        });

        this.render();
    }

    static render() {
        const words = Storage.getWords();
        const searchTerm = this.searchBox.value.toLowerCase();
        const filteredWords = words.filter(word =>
            word.word.toLowerCase().includes(searchTerm) ||
            word.translation.toLowerCase().includes(searchTerm)
        );

        this.container.innerHTML = '';
        if (filteredWords.length === 0) {
            this.container.innerHTML = '<p>No words found. Add some!</p>';
            this.counter.textContent = '0 words';
            return;
        }

        this.counter.textContent = `${filteredWords.length} word(s)`;

        filteredWords.forEach(word => {
            const item = document.createElement('div');
            item.className = 'word-item';
            item.dataset.id = word.word;
            const learnPercentage = ((word.learnStatus || 0) / 7) * 100;
            item.innerHTML = `
                <div>
                    <strong>${word.word}</strong>: ${word.translation}
                    <br>
                    <small>Learn Status: ${learnPercentage.toFixed(0)}%</small>
                </div>
                <div class="word-item-actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            `;
            this.container.appendChild(item);
        });
    }

    static toggleView() {
        this.container.classList.toggle('grid');
        this.container.classList.toggle('list');
        // Default to list if no class is present
        if (!this.container.classList.contains('grid') && !this.container.classList.contains('list')) {
            this.container.classList.add('list');
        }
    }
}
