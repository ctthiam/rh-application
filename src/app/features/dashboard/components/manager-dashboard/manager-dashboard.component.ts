// src/app/features/dashboard/components/manager-dashboard/manager-dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DashboardService, DashboardStats, DashboardChartData } from '../../services/dashboard.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { TaskService } from '../../../../core/services/task.service';
import { DepartmentService } from '../../../../core/services/department.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';

interface ManagerDashboardData {
  stats: DashboardStats;
  departmentEmployees: any[];
  departmentTasks: any[];
  chartData: DashboardChartData;
}

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  stats: DashboardStats = {
    totalEmployees: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    todayTasks: 0
  };

  chartData: DashboardChartData = {
    tasksByStatus: { labels: [], data: [], colors: [] },
    tasksByDepartment: { labels: [], data: [] },
    employeesByDepartment: { labels: [], data: [] },
    tasksThisMonth: { labels: [], data: [] }
  };

  departmentEmployees: any[] = [];
  departmentTasks: any[] = [];
  recentTasks: any[] = [];
  currentUser: any = null;
  userDepartment: any = null;
  isLoading = false;

  // Configuration des cartes de statistiques pour manager
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
    if (!this.currentUser) {
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    // Charger le département du manager
    this.departmentService.getDepartmentsByManager(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          if (departments.length > 0) {
            this.userDepartment = departments[0]; // Un manager gère généralement un département
            this.loadManagerData();
          } else {
            console.warn('Aucun département trouvé pour ce manager');
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

  private updateStatCards(): void {
    this.statCards[0].value = this.departmentEmployees.length;
    this.statCards[1].value = this.departmentTasks.length;
    this.statCards[2].value = this.departmentTasks.filter(t => t.status === 2).length;
    this.statCards[3].value = this.departmentTasks.filter(t => t.isOverdue).length;
  }

  private generateChartData(): void {
    // Graphique des tâches par statut (département seulement)
    const tasksByStatus = {
      labels: ['En cours', 'Terminées'],
      data: [
        this.departmentTasks.filter(t => t.status === 1).length,
        this.departmentTasks.filter(t => t.status === 2).length
      ],
      colors: ['#ff9800', '#4caf50']
    };

    // Graphique des tâches par employé du département
    const employeeTasks: { [key: string]: number } = {};
    this.departmentEmployees.forEach(emp => {
      employeeTasks[emp.fullName] = this.departmentTasks.filter(t => t.employeeName === emp.fullName).length;
    });

    const tasksByEmployee = {
      labels: Object.keys(employeeTasks),
      data: Object.values(employeeTasks)
    };

    // Graphique des tâches créées ce mois dans le département
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const tasksThisMonth = {
      labels: Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
      data: Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const targetDate = new Date(currentYear, currentMonth, day);
        return this.departmentTasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate.toDateString() === targetDate.toDateString();
        }).length;
      })
    };

    this.chartData = {
      tasksByStatus,
      tasksByDepartment: tasksByEmployee,
      employeesByDepartment: { labels: [this.userDepartment.name], data: [this.departmentEmployees.length] },
      tasksThisMonth
    };
  }

  onRefresh(): void {
    this.loadDashboardData();
  }

  onCreateTask(): void {
    // Navigation vers la création de tâche avec département pré-sélectionné
    // this.router.navigate(['/tasks/add'], { queryParams: { departmentId: this.userDepartment.id } });
  }

  onViewEmployee(employeeId: number): void {
    // Navigation vers les détails de l'employé
    // this.router.navigate(['/employees', employeeId]);
  }

  onViewTask(taskId: number): void {
    // Navigation vers les détails de la tâche
    // this.router.navigate(['/tasks', taskId]);
  }

  // Getters pour les métriques calculées
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

  get pendingTasks(): any[] {
    return this.departmentTasks.filter(t => t.status === 1).slice(0, 5);
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