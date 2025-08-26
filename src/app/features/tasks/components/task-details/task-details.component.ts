// src/app/features/tasks/components/task-details/task-details.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { Task, TaskStatus, TaskPriority } from '../../../../core/models/task.model';
import { UserRole } from '../../../../core/models/user.model';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-task-details',
  template: `
    <div class="task-details-container">
      <!-- Loading -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner></mat-spinner>
        <p>Chargement de la tâche...</p>
      </div>

      <!-- Task Details -->
      <div *ngIf="task && !isLoading" class="task-content">
        <!-- Header -->
        <div class="task-header">
          <div class="header-content">
            <h1 class="task-title">{{ task.title }}</h1>
            <div class="task-badges">
              <mat-chip [style.background-color]="getPriorityColor(task.priority)" [style.color]="'white'">
                <mat-icon>flag</mat-icon>
                {{ task.priority }}
              </mat-chip>
              <mat-chip [color]="getStatusColor(task.status)">
                {{ getStatusLabel(task.status) }}
              </mat-chip>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="task-actions">
            <button mat-icon-button (click)="goBack()" matTooltip="Retour">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <button 
              mat-raised-button 
              color="accent"
              *ngIf="canCompleteTask() && task.status !== 2"
              (click)="completeTask()">
              <mat-icon>check_circle</mat-icon>
              Marquer terminé
            </button>
            <button 
              mat-raised-button 
              color="primary"
              *ngIf="canEditTask()"
              (click)="editTask()">
              <mat-icon>edit</mat-icon>
              Modifier
            </button>
          </div>
        </div>

        <!-- Content -->
        <mat-card class="details-card">
          <mat-card-content>
            <div class="task-description">
              <h3>Description</h3>
              <p>{{ task.description }}</p>
            </div>

            <div class="task-info">
              <div class="info-item">
                <mat-icon>person</mat-icon>
                <div>
                  <label>Assigné à</label>
                  <span>{{ task.assignedToName }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <mat-icon>schedule</mat-icon>
                <div>
                  <label>Date limite</label>
                  <span>{{ task.dueDate | date:'full' }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <mat-icon>business</mat-icon>
                <div>
                  <label>Département</label>
                  <span>{{ task.departmentName }}</span>
                </div>
              </div>
              
              <div class="info-item" *ngIf="task.completedAt">
                <mat-icon>check_circle</mat-icon>
                <div>
                  <label>Terminé le</label>
                  <span>{{ task.completedAt | date:'full' }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .task-details-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .loading-container {
      text-align: center;
      padding: 60px 20px;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 20px;

      .header-content {
        flex: 1;

        .task-title {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 500;
          color: #333;
        }

        .task-badges {
          display: flex;
          gap: 8px;
        }
      }

      .task-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }

    .details-card {
      border-radius: 12px;

      .task-description {
        margin-bottom: 24px;

        h3 {
          margin: 0 0 8px 0;
          color: #666;
          font-size: 16px;
        }

        p {
          margin: 0;
          line-height: 1.6;
          color: #333;
        }
      }

      .task-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 8px;

          mat-icon {
            color: #666;
          }

          div {
            label {
              display: block;
              font-size: 12px;
              color: #666;
              margin-bottom: 4px;
            }

            span {
              font-size: 14px;
              color: #333;
              font-weight: 500;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .task-header {
        flex-direction: column;
        align-items: stretch;

        .task-actions {
          justify-content: center;
        }
      }
    }
  `]
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task?: Task;
  isLoading = false;
  currentUser: any;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTask();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Corriger la ligne 259 - Type safety
private loadTask() {
  const taskId = Number(this.route.snapshot.paramMap.get('id'));
  if (!taskId) {
    this.router.navigate(['/tasks']);
    return;
  }

  this.isLoading = true;
  
  this.taskService.getTaskById(taskId).pipe(
    takeUntil(this.destroy$),
    catchError(() => {
      this.notificationService.showError('Tâche introuvable');
      this.router.navigate(['/tasks']);
      return of(null);
    })
  ).subscribe(task => {
    this.task = task || undefined; // CORRECTION: assigner undefined au lieu de null
    this.isLoading = false;
  });
}


  completeTask() {
    if (!this.task) return;

    this.taskService.completeTask(this.task.id).subscribe({
      next: (updatedTask) => {
        this.task = updatedTask;
        this.notificationService.showSuccess('Tâche marquée comme terminée');
      },
      error: () => {
        this.notificationService.showError('Erreur lors de la mise à jour');
      }
    });
  }

  editTask() {
    if (this.task) {
      this.router.navigate(['/tasks', this.task.id, 'edit']);
    }
  }

  goBack() {
    this.router.navigate(['/tasks']);
  }

  canEditTask(): boolean {
    if (!this.task || !this.currentUser) return false;
    const isAdmin = this.currentUser.role === UserRole.ADMIN;
    const isManager = this.currentUser.role === UserRole.MANAGER;
    return isAdmin || (isManager && this.task.departmentId === this.currentUser.departmentId);
  }

  canCompleteTask(): boolean {
    if (!this.task || !this.currentUser) return false;
    return this.task.assignedToId === this.currentUser.id || this.canEditTask();
  }

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
}