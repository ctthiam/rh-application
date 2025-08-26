export enum TaskStatus {
  EN_COURS = 1,
  TERMINE = 2,
  EN_RETARD = 3,
  ANNULE = 4
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate: Date;
  status: TaskStatus;
  statusText: string;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  createdAt: Date;
  completedAt?: Date;
  isOverdue: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate: Date;
  employeeId: number;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  dueDate: Date;
  status: TaskStatus;
  employeeId: number;
}