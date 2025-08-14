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
                const isReverse = w.learnStatus >= 3;
                const correctAnswer = isReverse ? w.word : w.translation;
                const distractors = this.generateDistractors(correctAnswer, allWords, isReverse ? 'word' : 'translation');
                const options = this.shuffleArray([correctAnswer, ...distractors]);
                return { ...w, answer: null, selected: null, options: options, isReverse: isReverse, correctArticle: w.article, selectedArticle: null };
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

        const questionHtml = currentWord.isReverse
            ? `<h2>${currentWord.translation}</h2>
               ${currentWord.correctArticle ? `
               <div class="article-quiz-options">
                   <button class="article-option-btn ${currentWord.selectedArticle === 'der' ? 'selected' : ''}" data-article="der">der</button>
                   <button class="article-option-btn ${currentWord.selectedArticle === 'die' ? 'selected' : ''}" data-article="die">die</button>
                   <button class="article-option-btn ${currentWord.selectedArticle === 'das' ? 'selected' : ''}" data-article="das">das</button>
               </div>` : ''}`
            : `<h2>${currentWord.article ? currentWord.article + ' ' : ''}${currentWord.word}</h2>`;

        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = `
            <div class="card ${currentWord.answer === true ? 'correct' : currentWord.answer === false ? 'incorrect' : ''}">
                ${questionHtml}
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
                    ${options.map(option => `<button class="option-btn ${currentWord.selected === option ? 'selected' : ''}" data-option="${option}">${option}</button>`).join('')}
                </div>
                <div class="quiz-navigation">
                    <button id="next-btn">${currentWord.answer === null ? 'Submit Answer' : 'Next Question'}</button>
                </div>
                <div class="quiz-progress">
                    Question ${this.session.currentIndex + 1} of ${this.session.totalQuestions}
                </div>
            </div>
        `;
    }

    static generateDistractors(correctAnswer, wordPool, type = 'translation') {
        const distractors = [];
        const field = type === 'word' ? 'word' : 'translation';
        const pool = this.shuffleArray(wordPool.filter(w => w[field] !== correctAnswer));
        while (distractors.length < 3 && pool.length > 0) {
            distractors.push(pool.pop()[field]);
        }
        return distractors;
    }

    static handleAnswer(selectedOption) {
        if (!this.session) return;

        const currentWord = this.session.words[this.session.currentIndex];
        currentWord.selected = selectedOption; // This is the selected word

        let isCorrectWord = false;
        let isCorrectArtikel = true; // Assume true if not a reverse question or no artikel selected

        if (currentWord.isReverse) {
            const selectedArticleButton = document.querySelector('.article-quiz-options button.selected');
            const selectedArticle = selectedArticleButton ? selectedArticleButton.dataset.article : '';

            isCorrectWord = selectedOption === currentWord.word;
            isCorrectArtikel = currentWord.correctArticle === '' || selectedArticle === currentWord.correctArticle; // Modified

            currentWord.answer = isCorrectWord && isCorrectArtikel;

            // Store the selected article in the currentWord object
            currentWord.selectedArticle = selectedArticle;

        } else {
            isCorrectWord = selectedOption === currentWord.translation;
            currentWord.answer = isCorrectWord;
        }

        // Add class to selected option button
        const selectedOptionButton = document.querySelector(`.option-btn[data-option="${selectedOption}"]`);
        if (selectedOptionButton) {
            selectedOptionButton.classList.add('selected');
        }

        // Add class to card to indicate correct/incorrect
        const cardElement = document.querySelector('.card');
        if (cardElement) {
            if (currentWord.answer === true) {
                cardElement.classList.add('correct');
            } else if (currentWord.answer === false) {
                cardElement.classList.add('incorrect');
            }
        }

        // No re-render here. Re-rendering will be handled by app.js after handleAnswer.
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

        console.log("Quiz ended. Results:", results); // Add this
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
