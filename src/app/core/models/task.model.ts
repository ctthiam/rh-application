// src/app/core/models/task.model.ts (corrigé)
export interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  status: TaskStatus; // Utilise l'enum au lieu de number
  priority: TaskPriority;
  assignedToId: number;
  assignedToName: string;
  createdById: number;
  createdByName: string;
  departmentId: number;
  departmentName: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isOverdue?: boolean; // Ajouté comme propriété calculée
}

export enum TaskStatus {
  EN_COURS = 1,
  TERMINE = 2,
  EN_RETARD = 3,
  ANNULE = 4
}

export enum TaskPriority {
  FAIBLE = 'FAIBLE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

// Utilitaire pour convertir enum vers number et vice versa
export const TaskStatusMap = {
  [TaskStatus.EN_COURS]: 1,
  [TaskStatus.TERMINE]: 2,
  [TaskStatus.EN_RETARD]: 3,
  [TaskStatus.ANNULE]: 4
} as const;

export const TaskStatusReverseMap = {
  1: TaskStatus.EN_COURS,
  2: TaskStatus.TERMINE,
  3: TaskStatus.EN_RETARD,
  4: TaskStatus.ANNULE
} as const;

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate: Date;
  priority: TaskPriority;
  assignedToId: number;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  dueDate: Date;
  priority: TaskPriority;
  assignedToId: number;
  status: TaskStatus;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
  byStatus: TaskStatusCount[];
  byPriority: TaskPriorityCount[];
  byDepartment: TaskDepartmentCount[];
}

export interface TaskStatusCount {
  status: TaskStatus;
  count: number;
}

export interface TaskPriorityCount {
  priority: TaskPriority;
  count: number;
}

export interface TaskDepartmentCount {
  departmentId: number;
  departmentName: string;
  taskCount: number;
  completedCount: number;
}
