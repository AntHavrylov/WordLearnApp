class Storage {
    static saveWord(wordObject) {
        try {
            if (!wordObject || !wordObject.word || !wordObject.translation) {
                throw new Error("Invalid word object");
            }

            const words = this.getWords();

            if (words.some(word => word.word === wordObject.word)) {
                console.error("Duplicate word detected.");
                return false;
            }

            words.push(wordObject);
            this._saveWordsToLocalStorage(words);
            return true;
        } catch (error) {
            console.error("Error saving word:", error);
            return false;
        }
    }

    static getWords() {
        try {
            this._migrateWords(); // Call migration on every get to ensure it runs once
            const localData = localStorage.getItem('words');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error getting words:", error);
            return [];
        }
    }

    static _migrateWords() {
        const oldBackup = localStorage.getItem('wordsBackup');
        if (oldBackup) {
            try {
                const words = JSON.parse(oldBackup);
                localStorage.setItem('words', JSON.stringify(words));
                localStorage.removeItem('wordsBackup');
                console.log("Migrated words from wordsBackup to words.");
            } catch (error) {
                console.error("Error migrating old words backup:", error);
            }
        }
    }

    static deleteWord(wordId) {
        try {
            let words = this.getWords();
            const initialLength = words.length;
            words = words.filter(word => word.word !== wordId);
            if (words.length < initialLength) {
                this._saveWordsToLocalStorage(words);
                return true;
            }
            return false; // Word not found
        } catch (error) {
            console.error("Error deleting word:", error);
            return false;
        }
    }

    static updateWord(wordId, updatedWordObject) {
        try {
            if (!updatedWordObject || !updatedWordObject.word || !updatedWordObject.translation) {
                throw new Error("Invalid word object");
            }
            let words = this.getWords();
            const index = words.findIndex(word => word.word === wordId);
            if (index !== -1) {
                words[index] = updatedWordObject;
                this._saveWordsToLocalStorage(words);
                return true;
            }
            return false; // Word not found
        } catch (error) {
            console.error("Error updating word:", error);
            return false;
        }
    }

    static clearAllWords() {
        try {
            localStorage.removeItem('words');
            return true;
        } catch (error) {
            console.error("Error clearing all words:", error);
            return false;
        }
    }

    static exportWords() {
        try {
            const words = this.getWords();
            return JSON.stringify(words, null, 2);
        } catch (error) {
            console.error("Error exporting words:", error);
            return null;
        }
    }

    static importWords(jsonString) {
        try {
            const words = JSON.parse(jsonString);
            if (!Array.isArray(words)) {
                throw new Error("Invalid JSON format: must be an array of word objects.");
            }
            // Basic validation of each object
            for (const word of words) {
                if (!word || !word.word || !word.translation) {
                    throw new Error("Invalid word object in JSON string.");
                }
            }
            this._saveWordsToLocalStorage(words);
            return true;
        } catch (error) {
            console.error("Error importing words:", error);
            return false;
        }
    }

    static mergeWords(jsonString) {
        try {
            const newWords = JSON.parse(jsonString);
            if (!Array.isArray(newWords)) {
                throw new Error("Invalid JSON format: must be an array of word objects.");
            }

            const existingWords = this.getWords();
            const existingWordSet = new Set(existingWords.map(word => word.word));
            let importedCount = 0;

            for (const word of newWords) {
                if (!word || !word.word || !word.translation) {
                    console.error("Invalid word object in JSON string, skipping:", word);
                    continue;
                }
                if (!existingWordSet.has(word.word)) {
                    if (word.learnStatus === undefined) {
                        word.learnStatus = 0;
                    }
                    existingWords.push(word);
                    existingWordSet.add(word.word);
                    importedCount++;
                }
            }

            this._saveWordsToLocalStorage(existingWords);
            return importedCount;
        } catch (error) {
            console.error("Error importing words:", error);
            return 0;
        }
    }

    static _saveWordsToLocalStorage(words) {
        try {
            localStorage.setItem('words', JSON.stringify(words));
        } catch (error) {
            console.error("Error saving words to localStorage:", error);
        }
    }
}
