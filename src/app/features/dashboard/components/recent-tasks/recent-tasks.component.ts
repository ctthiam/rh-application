// src/app/features/dashboard/components/recent-tasks/recent-tasks.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';

import { Task, TaskStatus, TaskPriority } from '../../../../core/models/task.model';

export interface RecentTasksFilter {
  showDepartmentFilter: boolean;
  departmentName?: string;
  maxItems?: number;
  showActions?: boolean;
}

@Component({
  selector: 'app-recent-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatMenuModule
  ],
  template: `
    <div class="recent-tasks-container">
      <!-- En-tête -->
      <div class="tasks-header">
        <div class="header-title">
          <mat-icon>history</mat-icon>
          <h3>Activité Récente</h3>
          <span class="task-count" *ngIf="filteredTasks.length > 0">
            ({{ filteredTasks.length }})
          </span>
        </div>
        
        <div class="header-actions" *ngIf="showActions">
          <button mat-icon-button [matMenuTriggerFor]="filterMenu" matTooltip="Filtrer">
            <mat-icon>filter_list</mat-icon>
          </button>
          <button mat-icon-button routerLink="/tasks" matTooltip="Voir toutes les tâches">
            <mat-icon>open_in_new</mat-icon>
          </button>
        </div>
      </div>

      <!-- Menu de filtrage -->
      <mat-menu #filterMenu="matMenu">
        <div class="filter-menu">
          <h4>Filtres</h4>
          <div class="filter-options">
            <label class="filter-option">
              <input type="checkbox" [(ngModel)]="filters.showCompleted" (change)="applyFilters()">
              <span>Tâches terminées</span>
            </label>
            <label class="filter-option">
              <input type="checkbox" [(ngModel)]="filters.showOverdue" (change)="applyFilters()">
              <span>Tâches en retard</span>
            </label>
            <label class="filter-option">
              <input type="checkbox" [(ngModel)]="filters.showToday" (change)="applyFilters()">
              <span>Échéances aujourd'hui</span>
            </label>
          </div>
        </div>
      </mat-menu>

      <!-- Liste des tâches -->
      <div class="tasks-list" *ngIf="filteredTasks.length > 0; else noTasks">
        <div 
          class="task-item" 
          *ngFor="let task of displayedTasks; trackBy: trackByTaskId"
          [class.completed]="isCompleted(task)"
          [class.overdue]="isOverdue(task)"
          [class.due-today]="isDueToday(task)"
          [class.high-priority]="isHighPriority(task)"
          (click)="onTaskClick(task)"
        >
          <!-- Indicateur de priorité -->
          <div class="priority-indicator" [ngClass]="getPriorityClass(task.priority)">
            <mat-icon>{{ getPriorityIcon(task.priority) }}</mat-icon>
          </div>

          <!-- Contenu de la tâche -->
          <div class="task-content">
            <div class="task-header">
              <h4 class="task-title">{{ task.title }}</h4>
              <div class="task-meta">
                <span class="task-time">{{ formatTime(task.updatedAt) }}</span>
                <span class="task-department" *ngIf="showDepartmentFilter">{{ task.departmentName }}</span>
              </div>
            </div>
            
            <p class="task-description" *ngIf="task.description">
              {{ task.description | slice:0:80 }}{{ task.description.length > 80 ? '...' : '' }}
            </p>
            
            <div class="task-details">
              <div class="assignee">
                <mat-icon>person</mat-icon>
                <span>{{ task.assignedToName }}</span>
              </div>
              
              <div class="due-date" [ngClass]="getDueDateClass(task)">
                <mat-icon>schedule</mat-icon>
                <span>{{ formatDueDate(task.dueDate) }}</span>
              </div>
            </div>
          </div>

          <!-- Status et actions -->
          <div class="task-actions">
            <mat-chip-set>
              <mat-chip [ngClass]="getStatusClass(task.status)">
                <mat-icon>{{ getStatusIcon(task.status) }}</mat-icon>
                {{ getStatusLabel(task.status) }}
              </mat-chip>
            </mat-chip-set>
            
            <div class="action-buttons" *ngIf="showActions">
              <button 
                mat-icon-button 
                *ngIf="!isCompleted(task)"
                (click)="onCompleteTask($event, task)"
                matTooltip="Marquer terminé"
                class="complete-btn"
              >
                <mat-icon>check</mat-icon>
              </button>
              
              <button 
                mat-icon-button 
                (click)="onEditTask($event, task)"
                matTooltip="Modifier"
                class="edit-btn"
              >
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </div>

          <!-- Barre de progression (si applicable) -->
          <div class="progress-bar" *ngIf="task.completedAt && isCompleted(task)">
            <mat-progress-bar mode="determinate" value="100" color="primary"></mat-progress-bar>
          </div>
        </div>

        <!-- Bouton Voir plus -->
        <div class="load-more" *ngIf="hasMoreTasks">
          <button mat-stroked-button (click)="loadMore()" [disabled]="loading">
            <mat-icon *ngIf="!loading">expand_more</mat-icon>
            <mat-icon *ngIf="loading" class="spin">refresh</mat-icon>
            {{ loading ? 'Chargement...' : 'Voir plus' }}
          </button>
        </div>
      </div>

      <!-- État vide -->
      <ng-template #noTasks>
        <div class="empty-state">
          <mat-icon>assignment</mat-icon>
          <h4>Aucune activité récente</h4>
          <p>Les tâches récentes apparaîtront ici</p>
          <button mat-raised-button routerLink="/tasks/create" color="primary">
            <mat-icon>add</mat-icon>
            Créer une tâche
          </button>
        </div>
      </ng-template>

      <!-- Indicateur de chargement -->
      <div class="loading-indicator" *ngIf="loading && filteredTasks.length === 0">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p>Chargement des tâches récentes...</p>
      </div>
    </div>
  `,
  styles: [`
    .recent-tasks-container {
      width: 100%;
    }

    .tasks-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 500;
          color: #333;
        }

        .task-count {
          font-size: 0.9rem;
          color: #666;
          font-weight: normal;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .filter-menu {
      padding: 1rem;
      min-width: 200px;

      h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 500;
      }

      .filter-options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .filter-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;

          input[type="checkbox"] {
            margin: 0;
          }

          span {
            font-size: 0.9rem;
          }
        }
      }
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #fff;
      border-radius: 8px;
      border-left: 4px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
      }

      &.completed {
        opacity: 0.8;
        border-left-color: #4caf50;
        background: rgba(76, 175, 80, 0.02);
      }

      &.overdue {
        border-left-color: #f44336;
        background: rgba(244, 67, 54, 0.02);

        .task-title {
          color: #d32f2f;
        }
      }

      &.due-today {
        border-left-color: #ff9800;
        background: rgba(255, 152, 0, 0.02);
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 20px 20px 0;
          border-color: transparent #ff9800 transparent transparent;
        }
      }

      &.high-priority {
        .priority-indicator {
          animation: pulse 2s infinite;
        }
      }
    }

    .priority-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;

      &.priority-faible {
        background: rgba(76, 175, 80, 0.1);
        color: #4caf50;
      }

      &.priority-normale {
        background: rgba(33, 150, 243, 0.1);
        color: #2196f3;
      }

      &.priority-haute {
        background: rgba(255, 152, 0, 0.1);
        color: #ff9800;
      }

      &.priority-urgente {
        background: rgba(244, 67, 54, 0.1);
        color: #f44336;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .task-content {
      flex: 1;
      min-width: 0;

      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;

        .task-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #333;
          line-height: 1.3;
        }

        .task-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          flex-shrink: 0;

          .task-time {
            font-size: 0.75rem;
            color: #999;
          }

          .task-department {
            font-size: 0.7rem;
            color: #666;
            padding: 0.2rem 0.5rem;
            background: #f5f5f5;
            border-radius: 12px;
          }
        }
      }

      .task-description {
        margin: 0 0 0.75rem 0;
        font-size: 0.85rem;
        color: #666;
        line-height: 1.4;
      }

      .task-details {
        display: flex;
        gap: 1rem;
        align-items: center;

        .assignee,
        .due-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: #777;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .due-date {
          &.overdue {
            color: #f44336;
            font-weight: 500;
          }

          &.due-today {
            color: #ff9800;
            font-weight: 500;
          }
        }
      }
    }

    .task-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      flex-shrink: 0;

      mat-chip-set mat-chip {
        font-size: 0.75rem;
        min-height: 24px;
        
        &.status-en-cours {
          background: #e3f2fd;
          color: #1976d2;
        }

        &.status-termine {
          background: #e8f5e8;
          color: #2e7d32;
        }

        &.status-en-retard {
          background: #ffebee;
          color: #c62828;
        }

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .action-buttons {
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.3s ease;

        button {
          width: 28px;
          height: 28px;
          line-height: 28px;

          &.complete-btn:hover {
            color: #4caf50;
          }

          &.edit-btn:hover {
            color: #2196f3;
          }

          mat-icon {
            font-size: 16px;
          }
        }
      }

      .task-item:hover & .action-buttons {
        opacity: 1;
      }
    }

    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }

    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 1rem;

      button {
        min-width: 120px;

        .spin {
          animation: spin 1s linear infinite;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #666;

      mat-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: #ccc;
        margin-bottom: 1rem;
      }

      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.2rem;
        font-weight: 500;
      }

      p {
        margin: 0 0 1.5rem 0;
        font-size: 0.9rem;
      }
    }

    .loading-indicator {
      text-align: center;
      padding: 2rem;

      p {
        margin-top: 1rem;
        color: #666;
        font-size: 0.9rem;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .task-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;

        .task-content {
          width: 100%;

          .task-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;

            .task-meta {
              align-items: flex-start;
            }
          }

          .task-details {
            flex-wrap: wrap;
          }
        }

        .task-actions {
          flex-direction: row;
          width: 100%;
          justify-content: space-between;
          align-items: center;

          .action-buttons {
            opacity: 1;
          }
        }
      }

      .tasks-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;

        .header-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }
  `],
})
export class RecentTasksComponent implements OnInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Input() showDepartmentFilter: boolean = false;
  @Input() departmentName: string = '';
  @Input() maxItems: number = 10;
  @Input() showActions: boolean = true;
  @Input() loading: boolean = false;

  // État du composant
  filteredTasks: Task[] = [];
  displayedTasks: Task[] = [];
  currentDisplayCount: number = 5;
  
  // Filtres
  filters = {
    showCompleted: true,
    showOverdue: true,
    showToday: true
  };

  constructor() {}

  ngOnInit(): void {
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.applyFilters();
    }
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  applyFilters(): void {
    this.filteredTasks = this.tasks.filter(task => {
      if (!this.filters.showCompleted && this.isCompleted(task)) {
        return false;
      }
      if (!this.filters.showOverdue && this.isOverdue(task)) {
        return false;
      }
      if (!this.filters.showToday && this.isDueToday(task)) {
        return false;
      }
      return true;
    });

    this.updateDisplayedTasks();
  }

  updateDisplayedTasks(): void {
    this.displayedTasks = this.filteredTasks
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, Math.min(this.currentDisplayCount, this.maxItems));
  }

  loadMore(): void {
    this.currentDisplayCount += 5;
    this.updateDisplayedTasks();
  }

  get hasMoreTasks(): boolean {
    return this.filteredTasks.length > this.displayedTasks.length;
  }

  // Méthodes utilitaires pour les tâches
  isCompleted(task: Task): boolean {
    return task.status === TaskStatus.TERMINE;
  }

  isOverdue(task: Task): boolean {
    if (this.isCompleted(task)) return false;
    return new Date(task.dueDate) < new Date();
  }

  isDueToday(task: Task): boolean {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return today.toDateString() === dueDate.toDateString();
  }

  isHighPriority(task: Task): boolean {
    return task.priority === TaskPriority.HAUTE || task.priority === TaskPriority.URGENTE;
  }

  // Méthodes de style et d'affichage
  getPriorityClass(priority: TaskPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.FAIBLE:
        return 'low_priority';
      case TaskPriority.NORMALE:
        return 'flag';
      case TaskPriority.HAUTE:
        return 'priority_high';
      case TaskPriority.URGENTE:
        return 'report_problem';
      default:
        return 'flag';
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS:
        return 'status-en-cours';
      case TaskStatus.TERMINE:
        return 'status-termine';
      case TaskStatus.EN_RETARD:
        return 'status-en-retard';
      default:
        return '';
    }
  }

  getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS:
        return 'play_arrow';
      case TaskStatus.TERMINE:
        return 'check_circle';
      case TaskStatus.EN_RETARD:
        return 'schedule';
      default:
        return 'help';
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.EN_COURS:
        return 'En cours';
      case TaskStatus.TERMINE:
        return 'Terminé';
      case TaskStatus.EN_RETARD:
        return 'En retard';
      default:
        return 'Inconnu';
    }
  }

  getDueDateClass(task: Task): string {
    if (this.isOverdue(task)) return 'overdue';
    if (this.isDueToday(task)) return 'due-today';
    return '';
  }

  // Méthodes de formatage
  formatTime(date: Date): string {
    const now = new Date();
    const taskDate = new Date(date);
    const diffMs = now.getTime() - taskDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    
    return taskDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  formatDueDate(date: Date): string {
    const dueDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (this.isDueToday({ dueDate } as any)) return 'Aujourd\'hui';
    if (dueDate.toDateString() === tomorrow.toDateString()) return 'Demain';
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `En retard de ${Math.abs(diffDays)}j`;
    if (diffDays <= 7) return `Dans ${diffDays}j`;
    
    return dueDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Gestionnaires d'événements
  onTaskClick(task: Task): void {
    // Navigation vers les détails de la tâche
    // this.router.navigate(['/tasks', task.id]);
  }

  onCompleteTask(event: Event, task: Task): void {
    event.stopPropagation();
    // Émettre un événement ou appeler un service pour marquer la tâche comme terminée
    // this.taskCompleted.emit(task);
  }

  onEditTask(event: Event, task: Task): void {
    event.stopPropagation();
    // Navigation vers l'édition de la tâche
    // this.router.navigate(['/tasks', task.id, 'edit']);
  }
}