// src/app/features/dashboard/components/employee-dashboard/employee-dashboard.component.ts (corrigé)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, forkJoin, map } from 'rxjs';

import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { TaskStatus } from '../../../../core/models/task.model';

export interface EmployeeTask {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  status: TaskStatus; // Utiliser l'enum au lieu de number
  priority: string;
  departmentName: string;
  isOverdue: boolean;
  progress: number;
}

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss']
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données
  stats: DashboardStats = {
    totalEmployees: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    myTasks: 0,
    myCompletedTasks: 0,
    myOverdueTasks: 0
  };

  myTasks: EmployeeTask[] = [];
  recentTasks: EmployeeTask[] = [];
  todayTasks: EmployeeTask[] = [];
  overdueTasks: EmployeeTask[] = [];

  // État de l'interface
  isLoading = true;
  selectedTab = 0;
  
  // Colonnes pour les tables
  displayedColumns: string[] = ['title', 'description', 'dueDate', 'status', 'priority', 'actions'];

  constructor(
    private dashboardService: DashboardService,
    private taskService: TaskService,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger toutes les données du dashboard
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.loadingService.show();

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.notificationService.showError('Utilisateur non connecté');
      this.isLoading = false;
      this.loadingService.hide();
      return;
    }

    // Trouver l'employé correspondant à l'utilisateur connecté
    this.employeeService.getAllEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          // Correction : utiliser la propriété userId qui existe maintenant
          const currentEmployee = employees.find(emp => emp.userId === currentUser.id);
          if (currentEmployee) {
            this.loadEmployeeData(currentEmployee.id);
          } else {
            this.notificationService.showError('Employé non trouvé');
            this.isLoading = false;
            this.loadingService.hide();
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de la récupération de l\'employé:', error);
          this.notificationService.showError('Erreur lors du chargement des données');
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
  }

  /**
   * Charger les données spécifiques à l'employé
   */
  private loadEmployeeData(employeeId: number): void {
    forkJoin({
      stats: this.dashboardService.getDashboardStats(),
      tasks: this.taskService.getTasksByEmployee(employeeId)
    }).pipe(
      takeUntil(this.destroy$),
      map(({ stats, tasks }) => ({
        stats,
        tasks: tasks.map((task: any) => ({
          ...task,
          priority: task.priority || 'NORMALE',
          progress: task.progress || 0,
          isOverdue: this.isTaskOverdue(task)
        }))
      }))
    )
    .subscribe({
      next: ({ stats, tasks }) => {
        this.stats = stats;
        this.myTasks = tasks;
        this.processTasksData();
        this.isLoading = false;
        this.loadingService.hide();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des données:', error);
        this.notificationService.showError('Erreur lors du chargement du dashboard');
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  /**
   * Traiter les données des tâches pour les différentes catégories
   */
  private processTasksData(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tâches récentes (5 dernières)
    this.recentTasks = [...this.myTasks]
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 5);

    // Tâches du jour
    this.todayTasks = this.myTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    // Tâches en retard
    this.overdueTasks = this.myTasks.filter(task => 
      task.isOverdue && task.status !== TaskStatus.TERMINE
    );
  }

  /**
   * Vérifier si une tâche est en retard
   */
  private isTaskOverdue(task: any): boolean {
    if (task.status === TaskStatus.TERMINE) {
      return false;
    }
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  }

  /**
   * Marquer une tâche comme terminée
   */
  markTaskAsCompleted(taskId: number): void {
    this.loadingService.show();

    this.taskService.updateTaskStatus(taskId, TaskStatus.TERMINE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Tâche marquée comme terminée');
          this.loadDashboardData(); // Recharger les données
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour de la tâche:', error);
          this.notificationService.showError('Erreur lors de la mise à jour de la tâche');
          this.loadingService.hide();
        }
      });
  }

  /**
   * Obtenir la couleur selon le statut de la tâche
   */
  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS: return 'warn';
      case TaskStatus.TERMINE: return 'primary';
      case TaskStatus.EN_RETARD: return 'accent';
      default: return 'accent';
    }
  }

  /**
   * Obtenir le texte du statut
   */
  getStatusText(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS: return 'En cours';
      case TaskStatus.TERMINE: return 'Terminée';
      case TaskStatus.EN_RETARD: return 'En retard';
      case TaskStatus.ANNULE: return 'Annulée';
      default: return 'Inconnue';
    }
  }

  /**
   * Obtenir l'icône selon le statut
   */
  getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS: return 'schedule';
      case TaskStatus.TERMINE: return 'check_circle';
      case TaskStatus.EN_RETARD: return 'warning';
      case TaskStatus.ANNULE: return 'cancel';
      default: return 'help';
    }
  }

  /**
   * Obtenir la couleur de priorité
   */
  getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'haute': 
      case 'urgente': return '#f44336';
      case 'normale': return '#ff9800';
      case 'faible': return '#4caf50';
      default: return '#9e9e9e';
    }
  }

  /**
   * Vérifier si une tâche peut être marquée comme terminée
   */
  canMarkAsCompleted(task: EmployeeTask): boolean {
    return task.status === TaskStatus.EN_COURS;
  }

  /**
   * Actualiser les données
   */
  refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Obtenir le pourcentage de progression
   */
  getProgressPercentage(): number {
    if (this.stats.myTasks === 0) return 0;
    return Math.round((this.stats.myCompletedTasks! / this.stats.myTasks!) * 100);
  }

  /**
   * Obtenir le message de motivation
   */
  getMotivationMessage(): string {
    const progress = this.getProgressPercentage();
    
    if (progress === 100) {
      return "Félicitations ! Toutes vos tâches sont terminées !";
    } else if (progress >= 80) {
      return "Excellent travail ! Vous êtes presque au bout !";
    } else if (progress >= 60) {
      return "Bon rythme ! Continuez comme ça !";
    } else if (progress >= 40) {
      return "Vous progressez bien, gardez le cap !";
    } else if (progress >= 20) {
      return "C'est un bon début, persévérez !";
    } else {
      return "Commencez par vos tâches prioritaires !";
    }
  }

  /**
   * TrackBy function pour les notifications (à ajouter si vous avez une liste de notifications)
   */
  trackByNotificationId(index: number, notification: any): number {
    return notification.id || index;
  }
}