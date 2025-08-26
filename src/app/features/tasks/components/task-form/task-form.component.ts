// src/app/features/tasks/components/task-form/task-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, catchError, of, forkJoin } from 'rxjs';

import { Task, TaskPriority, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '../../../../core/models/task.model';
import { Employee } from '../../../../core/models/employee.model';
import { Department } from '../../../../core/models/department.model';
import { UserRole } from '../../../../core/models/user.model';

import { TaskService } from '../../../../core/services/task.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { DepartmentService } from '../../../../core/services/department.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  taskId?: number;

  // Data
  employees: Employee[] = [];
  departments: Department[] = [];
  filteredEmployees: Employee[] = [];
  currentTask?: Task;
  
  // User info
  currentUser: any;
  isAdmin = false;
  isManager = false;

  // Options
  priorityOptions = [
    { value: TaskPriority.FAIBLE, label: 'Faible', color: '#4CAF50' },
    { value: TaskPriority.NORMALE, label: 'Normale', color: '#2196F3' },
    { value: TaskPriority.HAUTE, label: 'Haute', color: '#FF9800' },
    { value: TaskPriority.URGENTE, label: 'Urgente', color: '#F44336' }
  ];

  statusOptions = [
    { value: TaskStatus.EN_COURS, label: 'En cours' },
    { value: TaskStatus.TERMINE, label: 'Terminé' },
    { value: TaskStatus.EN_RETARD, label: 'En retard' },
    { value: TaskStatus.ANNULE, label: 'Annulé' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.form = this.createForm();
  }

  ngOnInit() {
    this.initializeUser();
    this.checkMode();
    this.loadData();
    this.setupFormSubscriptions();
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
    }
  }

  private checkMode() {
    this.taskId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.taskId;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      dueDate: ['', [Validators.required, this.futureDateValidator]],
      priority: [TaskPriority.NORMALE, [Validators.required]],
      assignedToId: ['', [Validators.required]],
      departmentId: [{ value: '', disabled: !this.isAdmin }],
      status: [{ value: TaskStatus.EN_COURS, disabled: false }]
    });
  }

  private setupFormSubscriptions() {
    // Filtrer les employés par département
    this.form.get('departmentId')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(departmentId => {
      this.filterEmployeesByDepartment(departmentId);
    });

    // Validation de date en temps réel
    this.form.get('dueDate')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(date => {
      if (date && new Date(date) < new Date()) {
        this.form.get('dueDate')?.setErrors({ pastDate: true });
      }
    });
  }

  private loadData() {
    this.isLoading = true;

    const requests: any[] = [];

    // Charger les employés
    if (this.isAdmin) {
      requests.push(this.employeeService.getAllEmployees());
      requests.push(this.departmentService.getAllDepartments());
    } else if (this.isManager) {
      requests.push(this.employeeService.getEmployeesByDepartment(this.currentUser.departmentId));
      requests.push(of([{ id: this.currentUser.departmentId, name: this.currentUser.departmentName }]));
    }

    if (requests.length === 0) {
      this.isLoading = false;
      return;
    }

    forkJoin(requests).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des données');
        console.error('Erreur:', error);
        return of([[], []]);
      })
    ).subscribe(([employees, departments]) => {
      this.employees = employees || [];
      this.departments = departments || [];
      this.filteredEmployees = [...this.employees];

      // Pré-sélectionner le département du manager
      if (this.isManager && !this.isEditMode) {
        this.form.patchValue({ 
          departmentId: this.currentUser.departmentId 
        });
      }

      // Charger la tâche en mode édition
      if (this.isEditMode && this.taskId) {
        this.loadTask();
      } else {
        this.isLoading = false;
      }
    });
  }

  private loadTask() {
    this.taskService.getTaskById(this.taskId!).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.notificationService.showError('Tâche introuvable');
        this.router.navigate(['/tasks']);
        return of(null);
      })
    ).subscribe(task => {
      if (task) {
        this.currentTask = task;
        this.populateForm(task);
      }
      this.isLoading = false;
    });
  }

  private populateForm(task: Task) {
    this.form.patchValue({
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate),
      priority: task.priority,
      assignedToId: task.assignedToId,
      departmentId: task.departmentId,
      status: task.status
    });

    // Si on est en mode édition, activer le champ statut
    if (this.isEditMode) {
      this.form.get('status')?.enable();
    }
  }

  private filterEmployeesByDepartment(departmentId: number | string) {
    if (!departmentId || departmentId === 'all') {
      this.filteredEmployees = [...this.employees];
    } else {
      this.filteredEmployees = this.employees.filter(emp => 
        emp.departmentId === +departmentId
      );
    }

    // Réinitialiser la sélection d'employé si nécessaire
    const currentEmployeeId = this.form.get('assignedToId')?.value;
    if (currentEmployeeId && !this.filteredEmployees.find(emp => emp.id === +currentEmployeeId)) {
      this.form.patchValue({ assignedToId: '' });
    }
  }

  // Validateurs personnalisés
  private futureDateValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate >= today ? null : { pastDate: true };
  }

  // Actions publiques
  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode) {
      this.updateTask();
    } else {
      this.createTask();
    }
  }

  private createTask() {
    const formValue = this.form.value;
    
    const taskRequest: CreateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      assignedToId: +formValue.assignedToId
    };

    this.taskService.createTask(taskRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (task) => {
        this.notificationService.showSuccess('Tâche créée avec succès');
        this.router.navigate(['/tasks', task.id]);
      },
      error: (error) => {
        this.notificationService.showError('Erreur lors de la création de la tâche');
        console.error('Erreur:', error);
        this.isSubmitting = false;
      }
    });
  }

  private updateTask() {
    const formValue = this.form.value;
    
    const taskRequest: UpdateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      assignedToId: +formValue.assignedToId,
      status: formValue.status
    };

    this.taskService.updateTask(this.taskId!, taskRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (task) => {
        this.notificationService.showSuccess('Tâche modifiée avec succès');
        this.router.navigate(['/tasks', task.id]);
      },
      error: (error) => {
        this.notificationService.showError('Erreur lors de la modification de la tâche');
        console.error('Erreur:', error);
        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    if (this.isEditMode && this.taskId) {
      this.router.navigate(['/tasks', this.taskId]);
    } else {
      this.router.navigate(['/tasks']);
    }
  }

  onReset() {
    if (this.isEditMode && this.currentTask) {
      this.populateForm(this.currentTask);
    } else {
      this.form.reset();
      this.form.patchValue({
        priority: TaskPriority.NORMALE,
        status: TaskStatus.EN_COURS
      });

      if (this.isManager) {
        this.form.patchValue({ 
          departmentId: this.currentUser.departmentId 
        });
      }
    }
  }

  // Méthodes utilitaires pour le template
  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
    
    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} est requis`;
    }
    
    if (errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} doit contenir au moins ${errors['minlength'].requiredLength} caractères`;
    }
    
    if (errors['maxlength']) {
      return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${errors['maxlength'].requiredLength} caractères`;
    }
    
    if (errors['pastDate']) {
      return 'La date limite ne peut pas être dans le passé';
    }

    return 'Valeur invalide';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Le titre',
      description: 'La description',
      dueDate: 'La date limite',
      priority: 'La priorité',
      assignedToId: 'L\'employé assigné',
      departmentId: 'Le département',
      status: 'Le statut'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getPriorityColor(priority: TaskPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.color || '#666';
  }

  getSelectedEmployeeName(): string {
    const employeeId = this.form.get('assignedToId')?.value;
    if (!employeeId) return '';
    
    const employee = this.filteredEmployees.find(emp => emp.id === +employeeId);
    return employee ? employee.fullName : '';
  }

  getSelectedDepartmentName(): string {
    const departmentId = this.form.get('departmentId')?.value;
    if (!departmentId) return '';
    
    const department = this.departments.find(dept => dept.id === +departmentId);
    return department ? department.name : '';
  }

  // Validation en temps réel pour l'UX - CORRIGÉ
  onTitleInput() {
    const titleControl = this.form.get('title');
    if (titleControl?.value && titleControl.value.length >= 3 && titleControl.hasError('minlength')) {
      titleControl.updateValueAndValidity();
    }
  }

  onDescriptionInput() {
    const descControl = this.form.get('description');
    if (descControl?.value && descControl.value.length >= 10 && descControl.hasError('minlength')) {
      descControl.updateValueAndValidity();
    }
  }

  // Suggestions intelligentes
  suggestDueDate(days: number) {
    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + days);
    this.form.patchValue({ dueDate: suggestedDate });
  }

  suggestPriorityBasedOnDueDate() {
    const dueDate = this.form.get('dueDate')?.value;
    if (!dueDate) return;

    const today = new Date();
    const dueDateObj = new Date(dueDate);
    const daysDiff = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysDiff <= 1) {
      this.form.patchValue({ priority: TaskPriority.URGENTE });
    } else if (daysDiff <= 3) {
      this.form.patchValue({ priority: TaskPriority.HAUTE });
    } else if (daysDiff <= 7) {
      this.form.patchValue({ priority: TaskPriority.NORMALE });
    } else {
      this.form.patchValue({ priority: TaskPriority.FAIBLE });
    }
  }
}