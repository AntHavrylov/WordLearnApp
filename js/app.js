const APP_VERSION = "v0.0.1";

document.addEventListener('DOMContentLoaded', () => {
    WordList.init();
    // Stats.renderDashboard(); // This will be called by setOnLoadCallback
    setupFormValidation();
    setupQuizControls();
    setupSwipeGestures();
    setupAccessibilityControls();
    setupWordListToggle();
    setupAddWordToggle();
    setupDataManagementControls(); // Moved this call to the end

    // Display app version
    const appVersionElement = document.getElementById('app-version');
    if (appVersionElement) {
        appVersionElement.textContent = APP_VERSION;
    }

    // Load Google Charts and render dashboard
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(Stats.renderDashboard);
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
            // Remove 'selected' from all other option buttons
            document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            // Add 'selected' to the clicked button
            e.target.classList.add('selected');
        } else if (e.target.classList.contains('article-option-btn')) { // Handle article buttons
            // Remove 'selected' from all other article buttons
            document.querySelectorAll('.article-option-btn').forEach(btn => btn.classList.remove('selected'));
            // Add 'selected' to the clicked article button
            e.target.classList.add('selected');

            // Update selectedArticle in the current word object
            if (Quiz.session && Quiz.session.words[Quiz.session.currentIndex]) {
                Quiz.session.words[Quiz.session.currentIndex].selectedArticle = e.target.dataset.article;
            }

        } else if (e.target.id === 'next-btn') {
            const nextButton = e.target;
            if (nextButton.textContent === 'Submit Answer') {
                // Check answer
                const selectedOption = document.querySelector('.option-btn.selected'); // Get selected word option
                if (!selectedOption) {
                    // Optionally show a message to select an option
                    return;
                }
                Quiz.handleAnswer(selectedOption.textContent); // Pass the selected option
                Quiz.renderQuestion(); // Re-render to show result and change button text
                // Disable option buttons and artikel radio buttons
                document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
                document.querySelectorAll('input[name="quiz-artikel"]').forEach(radio => radio.disabled = true);

            } else if (nextButton.textContent === 'Next Question') {
                // Go to next question
                Quiz.nextCard();
                // Re-enable option buttons and artikel radio buttons for the new question
                document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = false);
                document.querySelectorAll('input[name="quiz-artikel"]').forEach(radio => radio.disabled = false);
            }
        } else if (e.target.id === 'reset-quiz') {
            Quiz.resetQuiz();
        } else if (e.target.classList.contains('toggle-description')) {
            Quiz.toggleDescription();
        }
    });
}

function setupDataManagementControls() {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportWords);
    }

    const importFile = document.getElementById('import-file');
    if (importFile) {
        importFile.addEventListener('change', importWords);
    }

    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllData);
    }

    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => Stats.resetStats());
    }

    const importFromDatasetBtn = document.getElementById('import-from-dataset-btn');
    if (importFromDatasetBtn) {
        importFromDatasetBtn.addEventListener('click', importFromDataset);
    }
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
    
    // Get the selected radio button value
    const selectedArticle = form.querySelector('input[name="article"]:checked');
    const articleValue = selectedArticle ? selectedArticle.value : ''; // Default to empty string if none selected

    if (!form.checkValidity()) {
        showMessage('Please fill out all required fields correctly.', 'error');
        const firstInvalidField = form.querySelector(':invalid');
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
        return;
    }

    const newWord = {
        word: wordInput.value.trim(),
        translation: translationInput.value.trim(),
        description: descriptionInput.value.trim(),
        article: articleValue,
        learnStatus: 0
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

function importFromDataset() {
    console.log("Attempting to import from dataset...");
    fetch('dataset/words.json')
        .then(response => {
            console.log("Fetch response:", response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched data:", data);
            const jsonString = JSON.stringify(data);
            console.log("JSON string to import:", jsonString);
            const importedCount = Storage.mergeWords(jsonString);
            console.log("Imported count:", importedCount);
            if (importedCount > 0) {
                WordList.render();
                Stats.renderDashboard();
                showMessage(`${importedCount} new word(s) imported successfully from the dataset!`, 'success');
            } else {
                showMessage('No new words to import from the dataset.', 'success');
            }
        })
        .catch(error => {
            console.error('Error importing from dataset:', error);
            showMessage('Failed to load words from the dataset.', 'error');
        });
}
