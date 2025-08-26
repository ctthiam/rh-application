// src/app/features/tasks/tasks.component.ts
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, map, startWith, switchMap, catchError, of } from 'rxjs';
import { FormControl } from '@angular/forms';

import { Task, TaskStatus, TaskPriority, TaskStatusMap } from '../../core/models/task.model';
import { Employee } from '../../core/models/employee.model';
import { UserRole } from '../../core/models/user.model';
import { TaskService } from '../../core/services/task.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmDeleteDialog } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data sources
  dataSource = new MatTableDataSource<Task>([]);
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];

  // Form controls
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  priorityFilter = new FormControl('all');
  employeeFilter = new FormControl('all');
  departmentFilter = new FormControl('all');
  dueDateFilter = new FormControl('all');

  // UI State
  isLoading = false;
  selectedTasks = new Set<number>();
  activeTab = 0;

  // User permissions
  currentUser: any;
  isAdmin = false;
  isManager = false;
  isEmployee = false;

  // Statistics
  taskStats = {
    total: 0,
    completed: 0,
    overdue: 0,
    today: 0
  };

  // Table configuration
  displayedColumns: string[] = [
    'select',
    'title',
    'assignedTo',
    'status',
    'priority',
    'dueDate',
    'department',
    'actions'
  ];

  // Filter options
  statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: TaskStatus.EN_COURS, label: 'En cours' },
    { value: TaskStatus.TERMINE, label: 'Terminé' },
    { value: TaskStatus.EN_RETARD, label: 'En retard' },
    { value: TaskStatus.ANNULE, label: 'Annulé' }
  ];

  priorityOptions = [
    { value: 'all', label: 'Toutes priorités' },
    { value: TaskPriority.FAIBLE, label: 'Faible' },
    { value: TaskPriority.NORMALE, label: 'Normale' },
    { value: TaskPriority.HAUTE, label: 'Haute' },
    { value: TaskPriority.URGENTE, label: 'Urgente' }
  ];

  dueDateOptions = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'tomorrow', label: 'Demain' },
    { value: 'thisWeek', label: 'Cette semaine' },
    { value: 'nextWeek', label: 'Semaine prochaine' },
    { value: 'overdue', label: 'En retard' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeUser();
    this.setupFilters();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.isAdmin = this.currentUser.role === UserRole.ADMIN;
      this.isManager = this.currentUser.role === UserRole.MANAGER;
      this.isEmployee = this.currentUser.role === UserRole.EMPLOYE;

      // Ajuster les colonnes selon les permissions
      if (this.isEmployee) {
        this.displayedColumns = this.displayedColumns.filter(col => 
          !['select', 'department'].includes(col)
        );
      }
    }
  }

  private setupFilters() {
    // Recherche en temps réel
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    // Filtres de statut, priorité, etc.
    [this.statusFilter, this.priorityFilter, this.employeeFilter, 
     this.departmentFilter, this.dueDateFilter].forEach(control => {
      control.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => this.applyFilters());
    });
  }

  private loadData() {
    this.isLoading = true;
    
    // Charger les employés pour les filtres (si MANAGER/ADMIN)
    if (this.isAdmin || this.isManager) {
      this.loadEmployees();
    }

    // Charger les tâches selon le rôle
    this.loadTasks();
  }

  private loadEmployees() {
    this.employeeService.getAllEmployees().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors du chargement des employés:', error);
        return of([]);
      })
    ).subscribe(employees => {
      this.employees = employees;
      this.filteredEmployees = employees;
    });
  }

  private loadTasks() {
    let tasksObservable;

    if (this.isAdmin) {
      tasksObservable = this.taskService.getAllTasks();
    } else if (this.isManager) {
      // Manager voit les tâches de son département
      tasksObservable = this.taskService.getTasksByDepartment(this.currentUser.departmentId);
    } else {
      // Employé voit ses propres tâches
      tasksObservable = this.taskService.getTasksByEmployee(this.currentUser.id);
    }

    tasksObservable.pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des tâches');
        console.error('Erreur:', error);
        return of([]);
      })
    ).subscribe(tasks => {
      this.processTasks(tasks);
      this.calculateStats(tasks);
      this.isLoading = false;
    });
  }

  private processTasks(tasks: Task[]) {
    // Ajouter la propriété isOverdue
    const processedTasks = tasks.map(task => ({
      ...task,
      isOverdue: this.isTaskOverdue(task)
    }));

    this.dataSource.data = processedTasks;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private isTaskOverdue(task: Task): boolean {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return task.status !== TaskStatus.TERMINE && dueDate < today;
  }

  private calculateStats(tasks: Task[]) {
    this.taskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === TaskStatus.TERMINE).length,
      overdue: tasks.filter(t => this.isTaskOverdue(t)).length,
      today: tasks.filter(t => this.isDueToday(t)).length
    };
  }

  private isDueToday(task: Task): boolean {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return today.toDateString() === dueDate.toDateString();
  }

  // Corriger la méthode applyFilters - ligne 254
private applyFilters() {
  this.dataSource.filterPredicate = (task: Task, filter: string) => {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    const statusFilter = this.statusFilter.value;
    const priorityFilter = this.priorityFilter.value;
    const employeeFilter = this.employeeFilter.value;
    const dueDateFilter = this.dueDateFilter.value;

    // Recherche textuelle
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm) ||
      task.assignedToName.toLowerCase().includes(searchTerm);

    // Filtre statut - CORRECTION : comparaison correcte des types
    const matchesStatus = statusFilter === 'all' || 
      (typeof statusFilter === 'number' && task.status === statusFilter) ||
      (typeof statusFilter === 'string' && TaskStatusMap[task.status].toString() === statusFilter);

    // Filtre priorité
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    // Filtre employé - CORRECTION : vérification de null
    const matchesEmployee = employeeFilter === 'all' || 
      (employeeFilter !== null && task.assignedToId === +employeeFilter);

    // Filtre date limite
    const matchesDueDate = this.matchesDueDateFilter(task, dueDateFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesEmployee && matchesDueDate;
  };

  this.dataSource.filter = 'trigger';
}

  private matchesDueDateFilter(task: Task, filter: any): boolean {
    if (filter === 'all') return true;

    const today = new Date();
    const dueDate = new Date(task.dueDate);

    switch (filter) {
      case 'today':
        return today.toDateString() === dueDate.toDateString();
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toDateString() === dueDate.toDateString();
      case 'thisWeek':
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        return dueDate >= today && dueDate <= endOfWeek;
      case 'nextWeek':
        const startOfNextWeek = new Date(today);
        startOfNextWeek.setDate(today.getDate() + (7 - today.getDay() + 1));
        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
        return dueDate >= startOfNextWeek && dueDate <= endOfNextWeek;
      case 'overdue':
        return this.isTaskOverdue(task);
      default:
        return true;
    }
  }

  // Actions publiques
  createTask() {
    this.router.navigate(['/tasks/create']);
  }

  editTask(task: Task) {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  viewTaskDetails(task: Task) {
    this.router.navigate(['/tasks', task.id]);
  }

  completeTask(task: Task) {
    if (task.status === TaskStatus.TERMINE) {
      this.notificationService.showWarning('Cette tâche est déjà terminée');
      return;
    }

    this.taskService.completeTask(task.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedTask) => {
        this.notificationService.showSuccess('Tâche marquée comme terminée');
        this.loadTasks(); // Recharger les données
      },
      error: (error) => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        console.error('Erreur:', error);
      }
    });
  }

  // Corriger la méthode deleteTask
deleteTask(task: Task) {
  const dialogRef = this.dialog.open(ConfirmDeleteDialog, { // CORRECTION: utiliser le bon nom
    data: {
      title: 'Supprimer la tâche',
      message: `Êtes-vous sûr de vouloir supprimer la tâche "${task.title}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Tâche supprimée avec succès');
          this.loadTasks();
        },
        error: (error) => {
          this.notificationService.showError('Erreur lors de la suppression');
          console.error('Erreur:', error);
        }
      });
    }
  });
}


  // Gestion de la sélection multiple
  toggleSelection(task: Task) {
    if (this.selectedTasks.has(task.id)) {
      this.selectedTasks.delete(task.id);
    } else {
      this.selectedTasks.add(task.id);
    }
  }

  toggleAllSelection() {
    if (this.isAllSelected()) {
      this.selectedTasks.clear();
    } else {
      this.dataSource.data.forEach(task => this.selectedTasks.add(task.id));
    }
  }

  isAllSelected(): boolean {
    return this.selectedTasks.size === this.dataSource.data.length;
  }

  // Actions en lot
  bulkComplete() {
    if (this.selectedTasks.size === 0) return;

    const completions = Array.from(this.selectedTasks).map(taskId =>
      this.taskService.completeTask(taskId)
    );

    // Exécuter toutes les complétions en parallèle
    Promise.all(completions.map(obs => obs.toPromise()))
      .then(() => {
        this.notificationService.showSuccess(`${this.selectedTasks.size} tâche(s) marquée(s) comme terminée(s)`);
        this.selectedTasks.clear();
        this.loadTasks();
      })
      .catch(error => {
        this.notificationService.showError('Erreur lors de la mise à jour en lot');
        console.error('Erreur:', error);
      });
  }

  // Corriger bulkDelete aussi
bulkDelete() {
  if (this.selectedTasks.size === 0) return;

  const dialogRef = this.dialog.open(ConfirmDeleteDialog, { // CORRECTION
    data: {
      title: 'Supprimer les tâches sélectionnées',
      message: `Êtes-vous sûr de vouloir supprimer ${this.selectedTasks.size} tâche(s) ?`,
      confirmText: 'Supprimer tout',
      cancelText: 'Annuler'
    }
  });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const deletions = Array.from(this.selectedTasks).map(taskId =>
          this.taskService.deleteTask(taskId)
        );

        Promise.all(deletions.map(obs => obs.toPromise()))
          .then(() => {
            this.notificationService.showSuccess(`${this.selectedTasks.size} tâche(s) supprimée(s)`);
            this.selectedTasks.clear();
            this.loadTasks();
          })
          .catch(error => {
            this.notificationService.showError('Erreur lors de la suppression en lot');
            console.error('Erreur:', error);
          });
      }
    });
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

  canEditTask(task: Task): boolean {
    return this.isAdmin || (this.isManager && task.departmentId === this.currentUser?.departmentId);
  }

  canDeleteTask(task: Task): boolean {
    return this.canEditTask(task);
  }

  canCompleteTask(task: Task): boolean {
    return task.assignedToId === this.currentUser?.id || this.canEditTask(task);
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.statusFilter.setValue('all');
    this.priorityFilter.setValue('all');
    this.employeeFilter.setValue('all');
    this.departmentFilter.setValue('all');
    this.dueDateFilter.setValue('all');
  }

  refreshData() {
    this.loadTasks();
  }

  exportTasks() {
    // TODO: Implémenter l'export CSV/Excel
    this.notificationService.showInfo('Export en cours de développement');
  }
}