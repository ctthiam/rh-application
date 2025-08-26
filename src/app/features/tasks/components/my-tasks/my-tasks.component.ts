// src/app/features/tasks/components/my-tasks/my-tasks.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { Task, TaskStatus, TaskPriority } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss']
})
export class MyTasksComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  isLoading = false;
  currentUser: any;

  // Filtres
  activeFilter = 'all';
  searchTerm = '';

  // Statistiques
  stats = {
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    today: 0
  };

  // Options de filtre
  filterOptions = [
    { value: 'all', label: 'Toutes mes tâches', icon: 'assignment' },
    { value: 'pending', label: 'En cours', icon: 'pending' },
    { value: 'completed', label: 'Terminées', icon: 'check_circle' },
    { value: 'overdue', label: 'En retard', icon: 'warning' },
    { value: 'today', label: 'Aujourd\'hui', icon: 'today' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.initializeUser();
    this.loadMyTasks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser() {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadMyTasks() {
    if (!this.currentUser) return;

    this.isLoading = true;

    this.taskService.getTasksByEmployee(this.currentUser.id).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement de vos tâches');
        console.error('Erreur:', error);
        return of([]);
      })
    ).subscribe(tasks => {
      this.tasks = this.processTasks(tasks);
      this.calculateStats();
      this.applyFilter();
      this.isLoading = false;
    });
  }

private processTasks(tasks: Task[]): Task[] {
  return tasks.map(task => ({
    ...task,
    isOverdue: this.isTaskOverdue(task),
    isDueToday: this.isTaskDueToday(task), // AJOUTÉ
    daysUntilDue: this.getDaysUntilDue(task)
  }));
}

  private isTaskOverdue(task: Task): boolean {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return task.status !== TaskStatus.TERMINE && dueDate < today;
  }

  private isTaskDueToday(task: Task): boolean {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return today.toDateString() === dueDate.toDateString();
  }

  private getDaysUntilDue(task: Task): number {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateStats() {
    this.stats = {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === TaskStatus.EN_COURS).length,
      completed: this.tasks.filter(t => t.status === TaskStatus.TERMINE).length,
      overdue: this.tasks.filter(t => this.isTaskOverdue(t)).length,
      today: this.tasks.filter(t => this.isTaskDueToday(t)).length
    };
  }

  // Actions publiques
  setFilter(filter: string) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  onSearch(term: string) {
    this.searchTerm = term.toLowerCase();
    this.applyFilter();
  }

  private applyFilter() {
    let filtered = [...this.tasks];

    // Filtre par catégorie
    switch (this.activeFilter) {
      case 'pending':
        filtered = filtered.filter(t => t.status === TaskStatus.EN_COURS);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === TaskStatus.TERMINE);
        break;
      case 'overdue':
        filtered = filtered.filter(t => this.isTaskOverdue(t));
        break;
      case 'today':
        filtered = filtered.filter(t => this.isTaskDueToday(t));
        break;
    }

    // Filtre par recherche
    if (this.searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(this.searchTerm) ||
        t.description.toLowerCase().includes(this.searchTerm)
      );
    }

    // Tri par priorité et date
    filtered.sort((a, b) => {
      // D'abord par statut (en cours avant terminé)
      if (a.status !== b.status) {
        return a.status === TaskStatus.EN_COURS ? -1 : 1;
      }
      
      // Puis par urgence (en retard en premier)
      if (this.isTaskOverdue(a) !== this.isTaskOverdue(b)) {
        return this.isTaskOverdue(a) ? -1 : 1;
      }

      // Puis par priorité
      const priorityOrder = {
        [TaskPriority.URGENTE]: 4,
        [TaskPriority.HAUTE]: 3,
        [TaskPriority.NORMALE]: 2,
        [TaskPriority.FAIBLE]: 1
      };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      // Enfin par date d'échéance
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    this.filteredTasks = filtered;
  }

  // Corriger la méthode completeTask
completeTask(task: Task) {
  if (task.status === TaskStatus.TERMINE) {
    this.notificationService.showWarning('Cette tâche est déjà terminée');
    return;
  }

  this.taskService.completeTask(task.id).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (updatedTask) => {
      const index = this.tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        this.tasks[index] = { 
          ...updatedTask, 
          isOverdue: false, 
          isDueToday: false // AJOUTÉ
        };
      }
      
      this.calculateStats();
      this.applyFilter();
      this.notificationService.showSuccess('Tâche marquée comme terminée !');
    },
    error: (error) => {
      this.notificationService.showError('Erreur lors de la mise à jour');
      console.error('Erreur:', error);
    }
  });
}

  refreshTasks() {
    this.loadMyTasks();
  }

  // Utilitaires pour le template
  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS: return 'En cours';
      case TaskStatus.TERMINE: return 'Terminé';
      case TaskStatus.EN_RETARD: return 'En retard';
      case TaskStatus.ANNULE: return 'Annulé';
      default: return 'Inconnu';
    }
  }

  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS: return 'primary';
      case TaskStatus.TERMINE: return 'accent';
      case TaskStatus.EN_RETARD: return 'warn';
      case TaskStatus.ANNULE: return '';
      default: return '';
    }
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.FAIBLE: return '#4CAF50';
      case TaskPriority.NORMALE: return '#2196F3';
      case TaskPriority.HAUTE: return '#FF9800';
      case TaskPriority.URGENTE: return '#F44336';
      default: return '#666';
    }
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.URGENTE: return 'priority_high';
      case TaskPriority.HAUTE: return 'keyboard_arrow_up';
      case TaskPriority.NORMALE: return 'remove';
      case TaskPriority.FAIBLE: return 'keyboard_arrow_down';
      default: return 'flag';
    }
  }

  getUrgencyClass(task: any): string {
    if (task.isOverdue) return 'overdue';
    if (task.isDueToday) return 'due-today';
    if (task.daysUntilDue <= 3) return 'due-soon';
    return '';
  }

  formatDueDate(task: any): string {
    if (task.isOverdue) {
      const daysOverdue = Math.abs(task.daysUntilDue);
      return `En retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`;
    }
    
    if (task.isDueToday) {
      return 'À faire aujourd\'hui';
    }
    
    if (task.daysUntilDue === 1) {
      return 'À faire demain';
    }
    
    if (task.daysUntilDue <= 7) {
      return `Dans ${task.daysUntilDue} jour${task.daysUntilDue > 1 ? 's' : ''}`;
    }
    
    return new Date(task.dueDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getMotivationalMessage(): string {
    const completedToday = this.tasks.filter(t => 
      t.status === TaskStatus.TERMINE && 
      new Date(t.completedAt || '').toDateString() === new Date().toDateString()
    ).length;

    if (completedToday > 0) {
      return `Bravo ! Vous avez terminé ${completedToday} tâche${completedToday > 1 ? 's' : ''} aujourd'hui !`;
    }

    const pendingToday = this.stats.today;
    if (pendingToday > 0) {
      return `Vous avez ${pendingToday} tâche${pendingToday > 1 ? 's' : ''} à terminer aujourd'hui !`;
    }

    if (this.stats.overdue > 0) {
      return `${this.stats.overdue} tâche${this.stats.overdue > 1 ? 's' : ''} en retard nécessite${this.stats.overdue > 1 ? 'nt' : ''} votre attention.`;
    }

    if (this.stats.pending === 0) {
      return 'Excellent travail ! Toutes vos tâches sont terminées !';
    }

    return 'Continuez votre excellent travail !';
  }
  trackByTaskId(index: number, task: Task): number {
  return task.id;
}

  getProgressPercentage(): number {
    if (this.stats.total === 0) return 0;
    return Math.round((this.stats.completed / this.stats.total) * 100);
  }
}