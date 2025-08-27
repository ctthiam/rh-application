// src/app/features/dashboard/components/manager-dashboard/manager-dashboard.component.ts - Version mise à jour

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DashboardService, DashboardStats, DashboardChartData } from '../../services/dashboard.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { TaskService } from '../../../../core/services/task.service';
import { DepartmentService } from '../../../../core/services/department.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';

// Import des nouveaux composants
import { DashboardChartsComponent, ManagerChartData } from '../dashboard-charts/dashboard-charts.component';
import { RecentTasksComponent } from '../recent-tasks/recent-tasks.component';

interface ManagerDashboardData {
  stats: DashboardStats;
  departmentEmployees: any[];
  departmentTasks: any[];
  chartData: ManagerChartData;
}

@Component({
  selector: 'app-manager-dashboard',
  template: `
<div class="manager-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <div class="header-content">
      <div class="title-section">
        <h1>
          <mat-icon>manage_accounts</mat-icon>
          Tableau de bord Manager
        </h1>
        <p class="subtitle" *ngIf="userDepartment">
          Département {{ userDepartment.name }}
        </p>
      </div>
      
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="onCreateTask()">
          <mat-icon>add_task</mat-icon>
          Nouvelle Tâche
        </button>
        <button mat-raised-button color="accent" (click)="onRefresh()" [disabled]="isLoading">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div class="loading-overlay" *ngIf="isLoading">
    <mat-spinner diameter="50"></mat-spinner>
  </div>

  <!-- Main Content -->
  <div class="dashboard-content" [class.loading]="isLoading">
    
    <!-- Department Stats -->
    <div class="stats-section">
      <h2 class="section-title">
        <mat-icon>analytics</mat-icon>
        Statistiques du Département
      </h2>
      
      <div class="stats-grid">
        <mat-card class="stat-card" *ngFor="let card of statCards" [ngClass]="'stat-' + card.color">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon [ngClass]="'icon-' + card.color">{{ card.icon }}</mat-icon>
              <div class="stat-value">{{ card.value | number }}</div>
            </div>
            <div class="stat-title">{{ card.title }}</div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Performance Overview -->
    <div class="performance-section">
      <h2 class="section-title">
        <mat-icon>trending_up</mat-icon>
        Performance du Département
      </h2>
      
      <div class="performance-grid">
        <mat-card class="performance-card completion">
          <mat-card-content>
            <div class="perf-header">
              <h3>Taux de Completion</h3>
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="perf-value">{{ departmentCompletionRate }}%</div>
            <mat-progress-bar mode="determinate" [value]="departmentCompletionRate" color="primary"></mat-progress-bar>
            <div class="perf-detail">
              {{ stats.completedTasks }} tâches terminées sur {{ departmentTasks.length }}
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="performance-card active">
          <mat-card-content>
            <div class="perf-header">
              <h3>Employés Actifs</h3>
              <mat-icon>people_alt</mat-icon>
            </div>
            <div class="perf-value">{{ activeEmployees }}</div>
            <mat-progress-bar mode="determinate" [value]="(activeEmployees / departmentEmployees.length) * 100" color="accent"></mat-progress-bar>
            <div class="perf-detail">
              {{ activeEmployees }} sur {{ departmentEmployees.length }} employés
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="performance-card overdue">
          <mat-card-content>
            <div class="perf-header">
              <h3>Tâches en Retard</h3>
              <mat-icon>warning</mat-icon>
            </div>
            <div class="perf-value">{{ stats.overdueTasks }}</div>
            <mat-progress-bar mode="determinate" [value]="departmentOverdueRate" color="warn"></mat-progress-bar>
            <div class="perf-detail">
              {{ departmentOverdueRate }}% du total
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Graphiques analytiques -->
    <div class="charts-section">
      <app-dashboard-charts 
        [chartData]="managerChartData"
        [isManager]="true"
        [departmentName]="userDepartment?.name"
        [loading]="chartsLoading">
      </app-dashboard-charts>
    </div>

    <!-- Main Content Grid -->
    <div class="main-grid">
      
      <!-- Left Column -->
      <div class="left-column">
        
        <!-- Department Team -->
        <div class="team-section">
          <div class="section-header">
            <h2 class="section-title">
              <mat-icon>group</mat-icon>
              Mon Équipe
            </h2>
            <button mat-icon-button routerLink="/employees" matTooltip="Voir tous les employés">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </div>
          
          <mat-card class="team-card">
            <mat-card-content>
              <div class="employee-list" *ngIf="departmentEmployees.length > 0; else noEmployees">
                <div class="employee-item" *ngFor="let employee of departmentEmployees.slice(0, 6)" 
                     (click)="onViewEmployee(employee.id)">
                  <div class="employee-avatar">
                    <mat-icon>account_circle</mat-icon>
                  </div>
                  <div class="employee-info">
                    <div class="employee-name">{{ employee.fullName }}</div>
                    <div class="employee-role">{{ employee.position }}</div>
                  </div>
                  <div class="employee-stats">
                    <mat-chip-set>
                      <mat-chip>
                        {{ getTaskCountForEmployee(employee) }} tâches
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>
              </div>
              
              <ng-template #noEmployees>
                <div class="empty-state">
                  <mat-icon>group_off</mat-icon>
                  <p>Aucun employé dans ce département</p>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Top Performers -->
        <div class="performers-section" *ngIf="topPerformers.length > 0">
          <h2 class="section-title">
            <mat-icon>emoji_events</mat-icon>
            Top Performers
          </h2>
          
          <mat-card class="performers-card">
            <mat-card-content>
              <div class="performer-list">
                <div class="performer-item" *ngFor="let performer of topPerformers; let i = index"
                     [ngClass]="'rank-' + (i + 1)">
                  <div class="performer-rank">
                    <mat-icon *ngIf="i === 0">emoji_events</mat-icon>
                    <mat-icon *ngIf="i === 1">military_tech</mat-icon>
                    <mat-icon *ngIf="i === 2">workspace_premium</mat-icon>
                    <span class="rank-number">{{ i + 1 }}</span>
                  </div>
                  <div class="performer-info">
                    <div class="performer-name">{{ performer.fullName }}</div>
                    <div class="performer-stats">
                      {{ performer.completedTasks }}/{{ performer.totalTasks }} tâches
                    </div>
                  </div>
                  <div class="performer-rate">
                    <span class="rate-value">{{ performer.completionRate }}%</span>
                    <mat-progress-bar mode="determinate" [value]="performer.completionRate" 
                                    [color]="i === 0 ? 'primary' : 'accent'"></mat-progress-bar>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

      </div>

      <!-- Right Column -->
      <div class="right-column">
        
        <!-- Recent Tasks Component -->
        <div class="recent-tasks-section">
          <app-recent-tasks 
            [tasks]="recentTasks"
            [showDepartmentFilter]="false"
            [departmentName]="userDepartment?.name"
            [maxItems]="8"
            [showActions]="true"
            [loading]="recentTasksLoading">
          </app-recent-tasks>
        </div>

      </div>
    </div>

    <!-- Notifications Section -->
    <div class="notifications-section">
      <app-notifications 
        [notifications]="notifications"
        [loading]="notificationsLoading"
        (notificationClick)="onNotificationClick($event)"
        (markAsRead)="onMarkNotificationAsRead($event)"
        (clearAll)="onClearAllNotifications()">
      </app-notifications>
    </div>

  </div>
</div>
  `,
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données existantes
  stats: DashboardStats = {
    totalEmployees: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    todayTasks: 0
  };

  departmentEmployees: any[] = [];
  departmentTasks: any[] = [];
  recentTasks: any[] = [];
  currentUser: any = null;
  userDepartment: any = null;
  isLoading = false;

  // Nouvelles données pour les composants améliorés
  managerChartData: ManagerChartData | null = null;
  notifications: any[] = [];
  chartsLoading = false;
  recentTasksLoading = false;
  notificationsLoading = false;

  // Configuration des cartes existantes
  statCards = [
    {
      title: 'Employés de mon Département',
      icon: 'group',
      color: 'primary',
      value: 0,
      key: 'totalEmployees'
    },
    {
      title: 'Tâches Actives',
      icon: 'assignment',
      color: 'accent',
      value: 0,
      key: 'totalTasks'
    },
    {
      title: 'Tâches Terminées',
      icon: 'check_circle',
      color: 'primary',
      value: 0,
      key: 'completedTasks'
    },
    {
      title: 'Tâches en Retard',
      icon: 'warning',
      color: 'warn',
      value: 0,
      key: 'overdueTasks'
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private employeeService: EmployeeService,
    private taskService: TaskService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadDashboardData();
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  private loadDashboardData(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.loadingService.show();

    this.departmentService.getDepartmentsByManager(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          if (departments.length > 0) {
            this.userDepartment = departments[0];
            this.loadManagerData();
          } else {
            this.isLoading = false;
            this.loadingService.hide();
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement du département:', error);
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
  }

  private loadManagerData(): void {
    forkJoin({
      stats: this.dashboardService.getDashboardStats(),
      employees: this.employeeService.getEmployeesByDepartment(this.userDepartment.id),
      tasks: this.taskService.getTasksByDepartment(this.userDepartment.id),
      recentTasks: this.dashboardService.getRecentTasks(8)
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ stats, employees, tasks, recentTasks }) => {
        this.stats = stats;
        this.departmentEmployees = employees;
        this.departmentTasks = tasks;
        this.recentTasks = recentTasks.filter(task => 
          task.departmentName === this.userDepartment.name
        );
        
        this.updateStatCards();
        this.generateChartData();
        this.isLoading = false;
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données manager:', error);
        this.notificationService.showError('Erreur lors du chargement des données');
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  private generateChartData(): void {
    this.chartsLoading = true;

    // Générer les données pour le nouveau composant de graphiques
    const tasksByStatus = {
      labels: ['En cours', 'Terminées', 'En retard'],
      data: [
        this.departmentTasks.filter(t => t.status === 1).length,
        this.departmentTasks.filter(t => t.status === 2).length,
        this.departmentTasks.filter(t => t.isOverdue).length
      ],
      colors: ['#2196f3', '#4caf50', '#f44336']
    };

    const tasksByEmployee = {
      labels: this.departmentEmployees.map(emp => emp.fullName),
      data: this.departmentEmployees.map(emp => 
        this.departmentTasks.filter(t => t.employeeName === emp.fullName).length
      )
    };

    const productivityTrend = {
      labels: Array.from({ length: 30 }, (_, i) => `J${i + 1}`),
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 2))
    };

    const workloadDistribution = {
      labels: this.departmentEmployees.map(emp => emp.fullName.split(' ')[0]),
      data: this.departmentEmployees.map(emp => {
        const tasks = this.departmentTasks.filter(t => t.employeeName === emp.fullName);
        return tasks.filter(t => t.status === 1).length; // Tâches en cours
      })
    };

    const completionRate = {
      labels: ['Complétées', 'En cours'],
      data: [
        this.departmentTasks.filter(t => t.status === 2).length,
        this.departmentTasks.filter(t => t.status === 1).length
      ]
    };

    this.managerChartData = {
      tasksByStatus,
      tasksByEmployee,
      productivityTrend,
      workloadDistribution,
      completionRate
    };

    this.chartsLoading = false;
  }

  private loadNotifications(): void {
    this.notificationsLoading = true;
    
    this.dashboardService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.notificationsLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notifications:', error);
          this.notificationsLoading = false;
        }
      });
  }

  // Méthodes existantes conservées
  private updateStatCards(): void {
    this.statCards[0].value = this.departmentEmployees.length;
    this.statCards[1].value = this.departmentTasks.length;
    this.statCards[2].value = this.departmentTasks.filter(t => t.status === 2).length;
    this.statCards[3].value = this.departmentTasks.filter(t => t.isOverdue).length;
  }

  onRefresh(): void {
    this.loadDashboardData();
    this.loadNotifications();
  }

  onCreateTask(): void {
    // Navigation vers la création de tâche
  }

  onViewEmployee(employeeId: number): void {
    // Navigation vers les détails de l'employé
  }

  onViewTask(taskId: number): void {
    // Navigation vers les détails de la tâche
  }

  // Nouvelles méthodes pour les notifications
  onNotificationClick(notification: any): void {
    if (notification.actionUrl) {
      // Navigation vers l'URL d'action
    }
  }

  onMarkNotificationAsRead(notificationId: string): void {
    this.dashboardService.markNotificationAsRead(notificationId).subscribe({
      next: () => {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
      }
    });
  }

  onClearAllNotifications(): void {
    this.notifications.forEach(n => n.read = true);
  }

  // Getters conservés
  get departmentCompletionRate(): number {
    if (this.departmentTasks.length === 0) return 0;
    const completed = this.departmentTasks.filter(t => t.status === 2).length;
    return Math.round((completed / this.departmentTasks.length) * 100);
  }

  get departmentOverdueRate(): number {
    if (this.departmentTasks.length === 0) return 0;
    const overdue = this.departmentTasks.filter(t => t.isOverdue).length;
    return Math.round((overdue / this.departmentTasks.length) * 100);
  }

  get activeEmployees(): number {
    return this.departmentEmployees.filter(emp => 
      this.departmentTasks.some(task => task.employeeName === emp.fullName && task.status === 1)
    ).length;
  }

  get topPerformers(): any[] {
    const employeeStats = this.departmentEmployees.map(emp => {
      const empTasks = this.departmentTasks.filter(t => t.employeeName === emp.fullName);
      const completed = empTasks.filter(t => t.status === 2).length;
      const total = empTasks.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      return {
        ...emp,
        totalTasks: total,
        completedTasks: completed,
        completionRate: Math.round(completionRate)
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return employeeStats.slice(0, 3);
  }
  
  getTaskCountForEmployee(employee: any): number {
    return this.departmentTasks.filter(t => t.employeeName === employee.fullName).length;
  }
}