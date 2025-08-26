// src/app/core/models/common.model.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FilterOptions {
  searchTerm?: string;
  departmentId?: number;
  employeeId?: number;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
}

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

export interface NotificationMessage {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  color?: 'primary' | 'accent' | 'warn';
}

// src/app/core/models/task.model.ts
export enum TaskStatus {
  EN_COURS = 1,
  TERMINE = 2,
  EN_RETARD = 3,
  ANNULE = 4
}

export enum TaskPriority {
  BASSE = 1,
  NORMALE = 2,
  HAUTE = 3,
  CRITIQUE = 4
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  employeeId: number;
  employeeName: string;
  createdByUserId: number;
  createdByUserName: string;
  departmentId?: number;
  departmentName?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  employeeId: number;
  dueDate: Date;
  priority: TaskPriority;
  estimatedHours?: number;
  notes?: string;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  employeeId: number;
  dueDate: Date;
  priority: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  notes?: string;
  actualHours?: number;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  comment: string;
  createdAt: Date;
}

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;
  thisMonthTasks: number;
  averageCompletionTime: number;
  tasksByStatus: { [key in TaskStatus]: number };
  tasksByPriority: { [key in TaskPriority]: number };
}