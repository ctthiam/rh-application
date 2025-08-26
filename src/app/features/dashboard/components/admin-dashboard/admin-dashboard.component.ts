// src/app/features/dashboard/components/admin-dashboard/admin-dashboard.component.ts (mise à jour)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { User } from '../../../../core/models/user.model';
import { Task, TaskStatus } from '../../../../core/models/task.model';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: 'primary' | 'accent' | 'warn';
}

interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = false;
  
  // Statistiques
  stats: DashboardStats = {
    totalEmployees: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    todayTasks: 0
  };

  statCards: StatCard[] = [];
  recentTasks: Task[] = [];

  // Métriques calculées
  completionRate = 0;
  overdueRate = 0;
  todayTasksRate = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Charger les statistiques des employés
    this.employeeService.getAllEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.stats.totalEmployees = employees.length;
          this.updateStatCards();
          this.calculateMetrics();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
          this.isLoading = false;
          // Utiliser des données par défaut en cas d'erreur
          this.setDefaultStats();
        }
      });
  }

  private setDefaultStats(): void {
    this.stats = {
      totalEmployees: 25,
      totalDepartments: 8,
      totalTasks: 142,
      completedTasks: 95,
      overdueTasks: 12,
      todayTasks: 18
    };
    this.updateStatCards();
    this.calculateMetrics();
  }

  private updateStatCards(): void {
    this.statCards = [
      {
        title: 'Employés',
        value: this.stats.totalEmployees,
        icon: 'people',
        color: 'primary'
      },
      {
        title: 'Départements',
        value: this.stats.totalDepartments,
        icon: 'domain',
        color: 'accent'
      },
      {
        title: 'Tâches Actives',
        value: this.stats.totalTasks,
        icon: 'assignment',
        color: 'primary'
      },
      {
        title: 'Tâches en Retard',
        value: this.stats.overdueTasks,
        icon: 'warning',
        color: 'warn'
      }
    ];
  }

  private calculateMetrics(): void {
    if (this.stats.totalTasks > 0) {
      this.completionRate = Math.round(
        (this.stats.completedTasks / this.stats.totalTasks) * 100
      );
      this.overdueRate = Math.round(
        (this.stats.overdueTasks / this.stats.totalTasks) * 100
      );
      this.todayTasksRate = Math.round(
        (this.stats.todayTasks / this.stats.totalTasks) * 100
      );
    } else {
      this.completionRate = 0;
      this.overdueRate = 0;
      this.todayTasksRate = 0;
    }
  }

  onRefresh(): void {
    this.loadDashboardData();
  }

  getTaskStatusText(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS:
        return 'En cours';
      case TaskStatus.TERMINE:
        return 'Terminé';
      case TaskStatus.EN_RETARD:
        return 'En retard';
      case TaskStatus.ANNULE:
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  }

  getTaskStatusColor(status: TaskStatus): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case TaskStatus.EN_COURS:
        return 'primary';
      case TaskStatus.TERMINE:
        return 'accent';
      case TaskStatus.EN_RETARD:
        return 'warn';
      case TaskStatus.ANNULE:
        return 'warn';
      default:
        return 'primary';
    }
  }
}