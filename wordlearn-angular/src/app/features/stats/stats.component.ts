import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleChartsModule } from 'angular-google-charts';
import { StatsService } from '../../core/services/stats.service';
import { AppStats } from '../../core/models/stats.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, GoogleChartsModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  stats!: AppStats;
  mostDifficultWords: string[] = [];
  chartData: any[] = [];
  chartOptions: any;

  constructor(private statsService: StatsService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.stats = this.statsService.getStats();
    this.mostDifficultWords = this.statsService.getMostDifficultWords();
    this.prepareChartData();
  }

  prepareChartData(): void {
    this.chartData = [
      ['Date', 'Score (%)'],
      ...this.stats.sessionHistory.map(session => [new Date(session.date).toLocaleDateString(), session.percentage])
    ];

    this.chartOptions = {
      title: 'Quiz Score History',
      curveType: 'function',
      legend: { position: 'bottom' },
      hAxis: { title: 'Date' },
      vAxis: { title: 'Score (%)', minValue: 0, maxValue: 100 }
    };
  }

  resetStats(): void {
    if (this.statsService.resetStats()) {
      this.loadStats();
    }
  }
}