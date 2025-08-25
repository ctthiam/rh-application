export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface SelectOption {
  value: any;
  label: string;
}

export interface FilterOptions {
  search?: string;
  departmentId?: number;
  status?: any;
  userId?: number;
}

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}