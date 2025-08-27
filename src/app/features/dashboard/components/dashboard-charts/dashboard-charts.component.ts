// src/app/features/dashboard/components/dashboard-charts/dashboard-charts.component.ts

import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

export interface ChartDataset {
  labels: string[];
  data: number[];
  colors?: string[];
  backgroundColor?: string[];
  borderColor?: string[];
}

export interface ManagerChartData {
  tasksByStatus: ChartDataset;
  tasksByEmployee: ChartDataset;
  productivityTrend: ChartDataset;
  workloadDistribution: ChartDataset;
  completionRate: ChartDataset;
}

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <div class="charts-container">
      <!-- En-tête des graphiques -->
      <div class="charts-header">
        <h3>
          <mat-icon>analytics</mat-icon>
          Analyses du Département
        </h3>
        <div class="chart-controls">
          <mat-select [(value)]="selectedPeriod" (selectionChange)="onPeriodChange()">
            <mat-option value="7">7 derniers jours</mat-option>
            <mat-option value="30">30 derniers jours</mat-option>
            <mat-option value="90">3 derniers mois</mat-option>
          </mat-select>
        </div>
      </div>

      <!-- Indicateur de chargement -->
      <div class="loading-overlay" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Génération des graphiques...</p>
      </div>

      <!-- Grille des graphiques -->
      <div class="charts-grid" [class.loading]="loading">
        
        <!-- Graphique en secteurs - Répartition des tâches -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>pie_chart</mat-icon>
              Répartition des Tâches
            </mat-card-title>
            <mat-card-subtitle>Status des tâches de l'équipe</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas #statusChart></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item" *ngFor="let item of statusLegend">
                <span class="legend-color" [style.background-color]="item.color"></span>
                <span class="legend-text">{{ item.label }}: {{ item.value }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Graphique en barres - Performance par employé -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>bar_chart</mat-icon>
              Performance par Employé
            </mat-card-title>
            <mat-card-subtitle>Tâches terminées vs assignées</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas #employeeChart></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Graphique linéaire - Tendance de productivité -->
        <mat-card class="chart-card wide">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>trending_up</mat-icon>
              Tendance de Productivité
            </mat-card-title>
            <mat-card-subtitle>Évolution des tâches terminées par jour</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas #trendChart></canvas>
            </div>
            <div class="trend-stats">
              <div class="trend-item">
                <span class="trend-label">Moyenne quotidienne</span>
                <span class="trend-value">{{ averageDaily }} tâches</span>
              </div>
              <div class="trend-item">
                <span class="trend-label">Tendance</span>
                <span class="trend-value" [class]="trendDirection">
                  <mat-icon>{{ trendIcon }}</mat-icon>
                  {{ trendPercentage }}%
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Graphique radar - Répartition de la charge -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>donut_small</mat-icon>
              Répartition de la Charge
            </mat-card-title>
            <mat-card-subtitle>Charge de travail par employé</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas #workloadChart></canvas>
            </div>
            <div class="workload-insights">
              <div class="insight" *ngIf="overloadedEmployees.length > 0">
                <mat-icon class="warning">warning</mat-icon>
                <span>{{ overloadedEmployees.length }} employé(s) en surcharge</span>
              </div>
              <div class="insight" *ngIf="underutilizedEmployees.length > 0">
                <mat-icon class="info">info</mat-icon>
                <span>{{ underutilizedEmployees.length }} employé(s) sous-utilisé(s)</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- KPIs en temps réel -->
        <mat-card class="chart-card kpi-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>speed</mat-icon>
              KPIs en Temps Réel
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="kpi-grid">
              <div class="kpi-item">
                <div class="kpi-value">{{ velocityMetric }}</div>
                <div class="kpi-label">Vélocité</div>
                <div class="kpi-unit">tâches/semaine</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-value">{{ averageCompletionTime }}</div>
                <div class="kpi-label">Temps Moyen</div>
                <div class="kpi-unit">jours</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-value">{{ onTimeDeliveryRate }}%</div>
                <div class="kpi-label">Respect Délais</div>
                <div class="kpi-unit">taux</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-value">{{ teamEfficiencyScore }}%</div>
                <div class="kpi-label">Efficacité</div>
                <div class="kpi-unit">score</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      width: 100%;
      padding: 1rem 0;
    }

    .charts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.5rem;
        color: #333;
      }

      .chart-controls {
        display: flex;
        gap: 1rem;
        align-items: center;

        mat-select {
          min-width: 150px;
        }
      }
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      border-radius: 12px;

      p {
        margin-top: 1rem;
        color: #666;
        font-size: 0.9rem;
      }
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      position: relative;

      &.loading {
        pointer-events: none;
        opacity: 0.7;
      }

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }

    .chart-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }

      &.wide {
        grid-column: 1 / -1;
        
        @media (max-width: 1200px) {
          grid-column: auto;
        }
      }

      &.kpi-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        .mat-mdc-card-header-text {
          color: white;
        }
      }

      .mat-mdc-card-header {
        padding: 1rem 1.5rem 0.5rem;

        .mat-mdc-card-title {
          font-size: 1.1rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mat-mdc-card-subtitle {
          font-size: 0.85rem;
          opacity: 0.7;
          margin-top: 0.25rem;
        }
      }

      .mat-mdc-card-content {
        padding: 1rem 1.5rem 1.5rem;
      }
    }

    .chart-wrapper {
      position: relative;
      height: 250px;
      width: 100%;
      margin-bottom: 1rem;

      canvas {
        max-width: 100%;
        max-height: 100%;
      }
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: center;
      margin-top: 1rem;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-text {
          color: #666;
          font-weight: 500;
        }
      }
    }

    .trend-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;

      .trend-item {
        text-align: center;

        .trend-label {
          display: block;
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .trend-value {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          font-weight: bold;
          font-size: 1rem;

          &.positive {
            color: #4caf50;
          }

          &.negative {
            color: #f44336;
          }

          mat-icon {
            font-size: 1.2rem;
          }
        }
      }
    }

    .workload-insights {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;

      .insight {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;

        mat-icon {
          font-size: 1rem;

          &.warning {
            color: #ff9800;
          }

          &.info {
            color: #2196f3;
          }
        }
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-item {
      text-align: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(10px);

      .kpi-value {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #fff;
      }

      .kpi-label {
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
        color: rgba(255, 255, 255, 0.9);
      }

      .kpi-unit {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.7);
      }
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    .loading canvas {
      animation: pulse 2s infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardChartsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() chartData: ManagerChartData | null = null;
  @Input() isManager: boolean = true;
  @Input() departmentName: string = '';
  @Input() loading: boolean = false;

  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('employeeChart') employeeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workloadChart') workloadChartRef!: ElementRef<HTMLCanvasElement>;

  // Charts instances
  private statusChart: Chart | null = null;
  private employeeChart: Chart | null = null;
  private trendChart: Chart | null = null;
  private workloadChart: Chart | null = null;

  // Configuration
  selectedPeriod: string = '30';
  
  // Données calculées
  statusLegend: Array<{label: string, value: number, color: string}> = [];
  averageDaily: number = 0;
  trendPercentage: number = 0;
  trendDirection: 'positive' | 'negative' | 'neutral' = 'neutral';
  trendIcon: string = 'trending_flat';
  
  // KPIs
  velocityMetric: number = 0;
  averageCompletionTime: number = 0;
  onTimeDeliveryRate: number = 0;
  teamEfficiencyScore: number = 0;
  
  // Alertes
  overloadedEmployees: string[] = [];
  underutilizedEmployees: string[] = [];

  ngOnInit(): void {
    this.calculateMetrics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && this.chartData) {
      this.calculateMetrics();
      setTimeout(() => this.initializeCharts(), 100);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  onPeriodChange(): void {
    // Emettre un événement pour recharger les données
    // this.periodChanged.emit(this.selectedPeriod);
  }

  private calculateMetrics(): void {
    if (!this.chartData) return;

    // Calculer la légende du statut
    this.statusLegend = this.chartData.tasksByStatus.labels.map((label, index) => ({
      label,
      value: this.chartData!.tasksByStatus.data[index],
      color: this.chartData!.tasksByStatus.colors?.[index] || '#ccc'
    }));

    // Calculer la vélocité (exemple)
    const totalTasks = this.chartData.tasksByStatus.data.reduce((sum, val) => sum + val, 0);
    this.velocityMetric = Math.round(totalTasks / 4); // Tâches par semaine

    // Calculer le temps moyen de completion (simulé)
    this.averageCompletionTime = Math.round(Math.random() * 5 + 2);

    // Taux de respect des délais (simulé)
    this.onTimeDeliveryRate = Math.round(75 + Math.random() * 20);

    // Score d'efficacité de l'équipe
    this.teamEfficiencyScore = Math.round(this.onTimeDeliveryRate * 0.8 + Math.random() * 15);

    // Tendance (simulée)
    this.trendPercentage = Math.round(Math.random() * 30 - 15);
    this.trendDirection = this.trendPercentage > 5 ? 'positive' : 
                        this.trendPercentage < -5 ? 'negative' : 'neutral';
    this.trendIcon = this.trendDirection === 'positive' ? 'trending_up' :
                    this.trendDirection === 'negative' ? 'trending_down' : 'trending_flat';

    // Moyenne quotidienne
    this.averageDaily = Math.round(totalTasks / 30);

    // Identifier les employés en surcharge/sous-utilisés
    this.analyzeWorkload();
  }

  private analyzeWorkload(): void {
    if (!this.chartData?.tasksByEmployee) return;

    const avgTasks = this.chartData.tasksByEmployee.data.reduce((sum, val) => sum + val, 0) / 
                    this.chartData.tasksByEmployee.data.length;

    this.overloadedEmployees = [];
    this.underutilizedEmployees = [];

    this.chartData.tasksByEmployee.labels.forEach((name, index) => {
      const tasks = this.chartData!.tasksByEmployee.data[index];
      if (tasks > avgTasks * 1.3) {
        this.overloadedEmployees.push(name);
      } else if (tasks < avgTasks * 0.7) {
        this.underutilizedEmployees.push(name);
      }
    });
  }

  private initializeCharts(): void {
    this.destroyCharts();
    
    if (!this.chartData) return;

    // Graphique en secteurs
    this.createStatusChart();
    
    // Graphique en barres
    this.createEmployeeChart();
    
    // Graphique de tendance
    this.createTrendChart();
    
    // Graphique de charge
    this.createWorkloadChart();
  }

  private createStatusChart(): void {
    if (!this.statusChartRef) return;

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.chartData!.tasksByStatus.labels,
        datasets: [{
          data: this.chartData!.tasksByStatus.data,
          backgroundColor: this.chartData!.tasksByStatus.colors || ['#4caf50', '#ff9800', '#f44336'],
          borderWidth: 2,
          borderColor: '#fff',
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  private createEmployeeChart(): void {
    if (!this.employeeChartRef) return;

    const ctx = this.employeeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.employeeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData!.tasksByEmployee.labels,
        datasets: [{
          label: 'Tâches assignées',
          data: this.chartData!.tasksByEmployee.data,
          backgroundColor: '#2196f3',
          borderColor: '#1976d2',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            ticks: {
              maxRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  private createTrendChart(): void {
    if (!this.trendChartRef) return;

    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Données simulées pour la tendance
    const trendData = Array.from({length: 30}, () => Math.floor(Math.random() * 10 + 2));

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({length: 30}, (_, i) => `J${i + 1}`),
        datasets: [{
          label: 'Tâches terminées',
          data: trendData,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  private createWorkloadChart(): void {
    if (!this.workloadChartRef) return;

    const ctx = this.workloadChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.workloadChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: this.chartData!.workloadDistribution.labels,
        datasets: [{
          data: this.chartData!.workloadDistribution.data,
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(33, 150, 243, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(244, 67, 54, 0.8)'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: {
                size: 10
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private destroyCharts(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }
    if (this.employeeChart) {
      this.employeeChart.destroy();
      this.employeeChart = null;
    }
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }
    if (this.workloadChart) {
      this.workloadChart.destroy();
      this.workloadChart = null;
    }
  }
}