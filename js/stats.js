class Stats {
    static defaultStats = {
        totalWords: 0,
        quizzesTaken: 0,
        averageScore: 0,
        totalPercentageSum: 0, // New property to store the sum of all quiz percentages
        studyTime: 0, // in seconds
        wordStats: {}, // { word: { correct: 0, incorrect: 0 } }
        sessionHistory: []
    };

    static getStats() {
        const stats = localStorage.getItem('wordLearnStats');
        return stats ? JSON.parse(stats) : this.defaultStats;
    }

    static saveStats(stats) {
        localStorage.setItem('wordLearnStats', JSON.stringify(stats));
    }

    static updateStats(quizResults) {
        console.log("Updating stats with quizResults:", quizResults); // Add this
        const stats = this.getStats();
        console.log("Current stats before update:", stats); // Add this

        stats.quizzesTaken++;
        stats.studyTime += quizResults.timeSpent;
        stats.totalWords = Storage.getWords().length;

        // Update average score
        stats.totalPercentageSum += parseFloat(quizResults.percentage); // Ensure it's a number
        stats.averageScore = stats.totalPercentageSum / stats.quizzesTaken;

        // Update word stats
        quizResults.correctAnswers.forEach(word => {
            if (!stats.wordStats[word.word]) {
                stats.wordStats[word.word] = { correct: 0, incorrect: 0 };
            }
            stats.wordStats[word.word].correct++;
        });
        quizResults.incorrectAnswers.forEach(word => {
            if (!stats.wordStats[word.word]) {
                stats.wordStats[word.word] = { correct: 0, incorrect: 0 };
            }
            stats.wordStats[word.word].incorrect++;
        });

        // Add to session history
        stats.sessionHistory.push({
            date: new Date().toISOString(),
            score: quizResults.score,
            total: quizResults.totalQuestions,
            percentage: quizResults.percentage,
            timeSpent: quizResults.timeSpent
        });

        // Keep history to a reasonable size
        if (stats.sessionHistory.length > 20) {
            stats.sessionHistory.shift();
        }

        this.saveStats(stats);
        console.log("Stats after update:", stats); // Add this
    }

    static renderDashboard() {
        const stats = this.getStats();
        const container = document.getElementById('stats-dashboard');

        if (!container) return;

        const mostDifficultWords = Object.entries(stats.wordStats)
            .sort(([,a],[,b]) => (b.incorrect / (b.correct + b.incorrect)) - (a.incorrect / (a.correct + a.incorrect)))
            .slice(0, 5)
            .map(([word]) => word);

        container.innerHTML = `
            <h3>Statistics</h3>
            <div class="stats-grid">
                <div><strong>Total Words:</strong> ${stats.totalWords}</div>
                <div><strong>Quizzes Taken:</strong> ${stats.quizzesTaken}</div>
                <div><strong>Average Score:</strong> ${stats.averageScore.toFixed(2)}%</div>
                <div><strong>Total Study Time:</strong> ${(stats.studyTime / 60).toFixed(2)} mins</div>
            </div>
            <h4>Most Difficult Words:</h4>
            <ul>
                ${mostDifficultWords.map(word => `<li>${word}</li>`).join('') || '<li>No data yet</li>'}
            </ul>
            <h4>Recent Quizzes:</h4>
            <div id="quiz-history-chart"></div>
        `;

        // Call drawChart directly from here, passing the history
        // The actual chart drawing will happen in Stats.drawChart
        this.drawChart(stats.sessionHistory); // Changed from this.renderChart
    }

    static drawChart(history) { // Renamed from renderChart
        console.log("Rendering chart with history:", history); // Add this
        const chartContainer = document.getElementById('quiz-history-chart');
        if (!chartContainer) return;

        if (history.length === 0) {
            chartContainer.innerHTML = '<p>No quiz history available.</p>';
            console.log("No quiz history available."); // Add this
            return;
        }

        if (!window.google || !window.google.charts || !window.google.visualization) {
            console.log("Google Charts API not fully loaded yet. Retrying in 100ms...");
            setTimeout(() => Stats.drawChart(history), 100); // Retry after a short delay
            return;
        }

        // Ensure the specific chart type is available
        if (typeof google.visualization.LineChart === 'undefined') {
            console.log("google.visualization.LineChart is not defined yet. Retrying in 100ms...");
            setTimeout(() => Stats.drawChart(history), 100); // Retry after a short delay
            return;
        }

        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Date');
        data.addColumn('number', 'Score (%)');

        const rows = history.map(session => [new Date(session.date).toLocaleDateString(), parseFloat(session.percentage)]);
        data.addRows(rows);

        const options = {
                title: 'Quiz Score History',
                curveType: 'function',
                legend: { position: 'bottom' },
                hAxis: { title: 'Date' },
                vAxis: { title: 'Score (%)', minValue: 0, maxValue: 100 }
            };

            const chart = new google.visualization.LineChart(chartContainer);
            chart.draw(data, options);
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    static resetStats() {
        if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
            localStorage.removeItem('wordLearnStats');
            this.renderDashboard(); // Re-render dashboard with default stats
            return true;
        }
        return false;
    }
}