class Quiz {
    static session = null;
    static showDescription = false;

    static initializeQuiz(wordCount = 10) {
        const allWords = Storage.getWords();
        if (allWords.length < 4) {
            document.getElementById('cards-container').innerHTML = '<p>You need at least 4 words to start a quiz.</p>';
            return false;
        }

        const wordsForQuiz = this.shuffleArray(allWords).slice(0, wordCount);

        this.session = {
            words: wordsForQuiz.map(w => {
                const correctAnswer = w.translation;
                const distractors = this.generateDistractors(correctAnswer, allWords);
                const options = this.shuffleArray([correctAnswer, ...distractors]);
                return { ...w, answer: null, selected: null, options: options };
            }), // answer: true, false, or null
            currentIndex: 0,
            score: 0,
            totalQuestions: wordsForQuiz.length,
            startTime: new Date(),
            endTime: null
        };

        this.renderQuestion();
        return true;
    }

    static renderQuestion() {
        if (!this.session) return;

        const currentWord = this.session.words[this.session.currentIndex];
        const options = currentWord.options;
        const learnPercentage = ((currentWord.learnStatus || 0) / 7) * 100;

        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = `
            <div class="card">
                <h2>${currentWord.word}</h2>
                <div class="learn-status">
                    <span>Learn Process:</span>
                    <div class="learn-status-bar">
                        <div class="learn-status-progress" style="width: ${learnPercentage.toFixed(0)}%;"></div>
                    </div>
                    <span>${learnPercentage.toFixed(0)}%</span>
                </div>
                <p class="description" style="display: ${this.showDescription ? 'block' : 'none'};">${currentWord.description}</p>
                <button class="toggle-description quiz-toggle-btn">${this.showDescription ? '-' : '+'}</button>
                <div class="options">
                    ${options.map(option => `<button class="option-btn ${currentWord.selected === option ? 'selected' : ''}">${option}</button>`).join('')}
                </div>
                <div class="quiz-navigation">
                    <button id="prev-btn" ${this.session.currentIndex === 0 ? 'disabled' : ''}>Previous</button>
                    <button id="next-btn">${this.session.currentIndex === this.session.totalQuestions - 1 ? 'Finish' : 'Next'}</button>
                </div>
                <div class="quiz-progress">
                    Question ${this.session.currentIndex + 1} of ${this.session.totalQuestions}
                </div>
            </div>
        `;
    }

    static generateDistractors(correctAnswer, wordPool) {
        const distractors = [];
        const pool = this.shuffleArray(wordPool.filter(w => w.translation !== correctAnswer));
        while (distractors.length < 3 && pool.length > 0) {
            distractors.push(pool.pop().translation);
        }
        return distractors;
    }

    static handleAnswer(selectedOption) {
        if (!this.session) return;

        const currentWord = this.session.words[this.session.currentIndex];
        currentWord.selected = selectedOption;
        currentWord.answer = selectedOption === currentWord.translation;

        this.renderQuestion(); // Re-render to show selection
    }

    static nextCard() {
        if (!this.session) return;
        if (this.session.currentIndex < this.session.totalQuestions - 1) {
            this.session.currentIndex++;
            this.renderQuestion();
        } else {
            this.endQuiz();
        }
    }

    static previousCard() {
        if (!this.session) return;
        if (this.session.currentIndex > 0) {
            this.session.currentIndex--;
            this.renderQuestion();
        }
    }

    static endQuiz() {
        if (!this.session) return null;

        this.session.endTime = new Date();
        const correctAnswers = this.session.words.filter(w => w.answer === true);
        const incorrectAnswers = this.session.words.filter(w => w.answer === false);
        const score = correctAnswers.length;
        const percentage = this.calculateScore(score, this.session.totalQuestions);
        const timeSpent = (this.session.endTime - this.session.startTime) / 1000;

        // --- Update learnStatus ---
        const allWords = Storage.getWords();
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
        Storage._saveWordsToLocalStorage(allWords);
        // --- End of update ---


        const results = {
            score,
            percentage,
            totalQuestions: this.session.totalQuestions,
            timeSpent,
            correctAnswers,
            incorrectAnswers
        };

        this.displayResults(results);
        Stats.updateStats(results);
        Stats.renderDashboard();
        return results;
    }

    static displayResults(results) {
        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = `
            <div class="card quiz-results">
                <h2>Quiz Complete!</h2>
                <p>Your score: ${results.score} / ${results.totalQuestions} (${results.percentage}%)</p>
                <p>Time spent: ${results.timeSpent.toFixed(2)} seconds</p>
                <button id="reset-quiz">Start New Quiz</button>
            </div>
        `;
    }

    static toggleDescription() {
        if (!this.session) return;
        this.showDescription = !this.showDescription;
        this.renderQuestion();
    }
    
    static resetQuiz() {
        this.session = null;
        this.initializeQuiz();
    }

    static calculateScore(correct, total) {
        if (total === 0) return 0;
        return ((correct / total) * 100).toFixed(2);
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
