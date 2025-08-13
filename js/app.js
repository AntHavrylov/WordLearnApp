document.addEventListener('DOMContentLoaded', () => {
    WordList.init();
    Stats.renderDashboard();
    setupFormValidation();
    setupQuizControls();
    setupSwipeGestures();
    setupAccessibilityControls();
    setupWordListToggle();
    setupAddWordToggle();
    setupDataManagementControls(); // Moved this call to the end
});

function setupAddWordToggle() {
    const toggleButton = document.getElementById('toggle-add-word');
    const addWordContent = document.getElementById('add-word-content');
    const isHidden = localStorage.getItem('addWordHidden') === 'true';

    const updateButtonText = () => {
        toggleButton.textContent = addWordContent.classList.contains('hidden') ? '+' : '-';
    };

    if (isHidden) {
        addWordContent.classList.add('hidden');
    }
    updateButtonText(); // Set initial text

    toggleButton.addEventListener('click', () => {
        addWordContent.classList.toggle('hidden');
        localStorage.setItem('addWordHidden', addWordContent.classList.contains('hidden'));
        updateButtonText(); // Update text after toggle
    });
}

function setupWordListToggle() {
    const toggleButton = document.getElementById('toggle-word-list');
    const wordListContent = document.getElementById('word-list-content');
    const isHidden = localStorage.getItem('wordListHidden') === 'true';

    const updateButtonText = () => {
        toggleButton.textContent = wordListContent.classList.contains('hidden') ? '+' : '-';
    };

    if (isHidden) {
        wordListContent.classList.add('hidden');
    }
    updateButtonText(); // Set initial text

    toggleButton.addEventListener('click', () => {
        wordListContent.classList.toggle('hidden');
        localStorage.setItem('wordListHidden', wordListContent.classList.contains('hidden'));
        updateButtonText(); // Update text after toggle
    });
}

function setupQuizControls() {
    document.getElementById('start-quiz-btn').addEventListener('click', () => Quiz.initializeQuiz());
    document.getElementById('cards-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('option-btn')) {
            Quiz.handleAnswer(e.target.textContent);
        } else if (e.target.id === 'next-btn') {
            Quiz.nextCard();
        } else if (e.target.id === 'prev-btn') {
            Quiz.previousCard();
        } else if (e.target.id === 'reset-quiz') {
            Quiz.resetQuiz();
        } else if (e.target.classList.contains('toggle-description')) {
            Quiz.toggleDescription();
        }
    });
}

function setupDataManagementControls() {
    document.getElementById('export-btn').addEventListener('click', exportWords);
    document.getElementById('import-file').addEventListener('change', importWords);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
    document.getElementById('reset-stats-btn').addEventListener('click', () => Stats.resetStats());
}

function setupFormValidation() {
    const form = document.getElementById('add-word-form');
    form.addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const wordInput = document.getElementById('word');
    const translationInput = document.getElementById('translation');
    const descriptionInput = document.getElementById('description');

    if (!form.checkValidity()) {
        showMessage('Please fill out all required fields correctly.', 'error');
        return;
    }

    const newWord = {
        word: wordInput.value.trim(),
        translation: translationInput.value.trim(),
        description: descriptionInput.value.trim()
    };

    if (Storage.saveWord(newWord)) {
        WordList.render();
        showMessage('Word added successfully!', 'success');
        form.reset();
    } else {
        showMessage('This word already exists.', 'error');
    }
}

function showMessage(message, type) {
    const container = document.getElementById('message-container');
    container.textContent = message;
    container.className = type;

    setTimeout(() => {
        container.className = '';
        container.textContent = '';
    }, 3000);
}

function setupSwipeGestures() {
    const quizContainer = document.getElementById('cards-container');
    let touchstartX = 0;
    let touchendX = 0;

    quizContainer.addEventListener('touchstart', function(event) {
        touchstartX = event.changedTouches[0].screenX;
    }, false);

    quizContainer.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        if (touchendX < touchstartX) {
            Quiz.nextCard();
        }
        if (touchendX > touchstartX) {
            Quiz.previousCard();
        }
    }
}

function setupAccessibilityControls() {
    document.getElementById('contrast-toggle').addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
    });

    document.addEventListener('keydown', (e) => {
        if (Quiz.session) {
            const options = Array.from(document.querySelectorAll('.option-btn'));
            const focusedElement = document.activeElement;
            const currentIndex = options.indexOf(focusedElement);

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % options.length;
                options[nextIndex].focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const nextIndex = (currentIndex - 1 + options.length) % options.length;
                options[nextIndex].focus();
            }
        }
    });
}

function exportWords() {
    const jsonString = Storage.exportWords();
    if (jsonString) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wordlearn_export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage('Words exported successfully!', 'success');
    } else {
        showMessage('Failed to export words.', 'error');
    }
}

function importWords(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const jsonString = e.target.result;
        if (Storage.importWords(jsonString)) {
            WordList.render();
            Stats.renderDashboard();
            showMessage('Words imported successfully!', 'success');
        } else {
            showMessage('Failed to import words. Please check the file format.', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Are you sure you want to delete all your words and stats? This action cannot be undone.')) {
        Storage.clearAllWords();
        localStorage.removeItem('wordLearnStats'); // Also clear stats
        WordList.render();
        Stats.renderDashboard();
        showMessage('All data has been cleared.', 'success');
    }
}
