import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: 'primary' | 'accent' | 'warn';
  backgroundColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard-stats.component.html',
  styleUrls: ['./dashboard-stats.component.scss']
})
export class DashboardStatsComponent implements OnInit, OnChanges {
  @Input() userRole: 'ADMIN' | 'MANAGER' | 'EMPLOYE' = 'EMPLOYE';
  @Input() statsData: any = {};

  statCards: StatCard[] = [];

  ngOnInit(): void {
    this.generateStatCards();
  }

  ngOnChanges(): void {
    this.generateStatCards();
  }

  // Méthode trackBy
  trackByStat(index: number, stat: StatCard): string {
    return stat.title;
  }

  private generateStatCards(): void {
    switch (this.userRole) {
      case 'ADMIN':
        this.statCards = this.getAdminStats();
        break;
      case 'MANAGER':
        this.statCards = this.getManagerStats();
        break;
      case 'EMPLOYE':
        this.statCards = this.getEmployeeStats();
        break;
    }
  }

  private getAdminStats(): StatCard[] {
    return [
      {
        title: 'Total Employés',
        value: this.statsData.totalEmployees || 0,
        icon: 'people',
        color: 'primary',
        backgroundColor: '#e3f2fd',
        description: 'Employés actifs'
      },
      {
        title: 'Départements',
        value: this.statsData.totalDepartments || 0,
        icon: 'business',
        color: 'accent',
        backgroundColor: '#f3e5f5',
        description: 'Départements actifs'
      },
      {
        title: 'Total Tâches',
        value: this.statsData.totalTasks || 0,
        icon: 'assignment',
        color: 'primary',
        backgroundColor: '#e8f5e8',
        description: 'Toutes les tâches'
      },
      {
        title: 'Tâches Terminées',
        value: this.statsData.completedTasks || 0,
        icon: 'check_circle',
        color: 'accent',
        backgroundColor: '#e8f5e8',
        description: 'Tâches complétées'
      },
      {
        title: 'Tâches en Retard',
        value: this.statsData.overdueTasks || 0,
        icon: 'warning',
        color: 'warn',
        backgroundColor: '#fff3e0',
        description: 'Attention requise'
      },
      {
        title: 'Tâches Aujourd\'hui',
        value: this.statsData.todayTasks || 0,
        icon: 'today',
        color: 'primary',
        backgroundColor: '#e1f5fe',
        description: 'Échéance aujourd\'hui'
      }
    ];
  }

  private getManagerStats(): StatCard[] {
    return [
      {
        title: 'Mes Employés',
        value: this.statsData.totalEmployees || 0,
        icon: 'group',
        color: 'primary',
        backgroundColor: '#e3f2fd',
        description: 'Employés de mon équipe'
      },
      {
        title: 'Mes Départements',
        value: this.statsData.totalDepartments || 0,
        icon: 'business',
        color: 'accent',
        backgroundColor: '#f3e5f5',
        description: 'Départements gérés'
      },
      {
        title: 'Tâches Assignées',
        value: this.statsData.totalTasks || 0,
        icon: 'assignment',
        color: 'primary',
        backgroundColor: '#e8f5e8',
        description: 'Tâches de l\'équipe'
      },
      {
        title: 'Tâches Terminées',
        value: this.statsData.completedTasks || 0,
        icon: 'check_circle',
        color: 'accent',
        backgroundColor: '#e8f5e8',
        description: 'Complétées par l\'équipe'
      },
      {
        title: 'Tâches en Retard',
        value: this.statsData.overdueTasks || 0,
        icon: 'schedule',
        color: 'warn',
        backgroundColor: '#fff3e0',
        description: 'Nécessitent un suivi'
      },
      {
        title: 'Productivité',
        value: this.calculateProductivity(),
        icon: 'trending_up',
        color: 'primary',
        backgroundColor: '#e1f5fe',
        description: 'Tâches terminées (%)'
      }
    ];
  }

  private getEmployeeStats(): StatCard[] {
    return [
      {
        title: 'Mes Tâches',
        value: this.statsData.myTasks || 0,
        icon: 'assignment_ind',
        color: 'primary',
        backgroundColor: '#e3f2fd',
        description: 'Tâches assignées'
      },
      {
        title: 'Terminées',
        value: this.statsData.myCompletedTasks || 0,
        icon: 'check_circle',
        color: 'accent',
        backgroundColor: '#e8f5e8',
        description: 'Tâches complétées'
      },
      {
        title: 'En Retard',
        value: this.statsData.myOverdueTasks || 0,
        icon: 'warning',
        color: 'warn',
        backgroundColor: '#fff3e0',
        description: 'Attention requise'
      },
      {
        title: 'Ma Progression',
        value: this.calculateMyProgress(),
        icon: 'trending_up',
        color: 'primary',
        backgroundColor: '#e1f5fe',
        description: 'Progression (%)'
      }
    ];
  }

  private calculateProductivity(): number {
    const total = this.statsData.totalTasks || 0;
    const completed = this.statsData.completedTasks || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  private calculateMyProgress(): number {
    const total = this.statsData.myTasks || 0;
    const completed = this.statsData.myCompletedTasks || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  getProgressColor(value: number): string {
    if (value >= 80) return '#4caf50';
    if (value >= 60) return '#ff9800';
    if (value >= 40) return '#ff5722';
    return '#f44336';
  }

  getProgressMessage(value: number): string {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Bon';
    if (value >= 40) return 'Moyen';
    return 'À améliorer';
  }
}