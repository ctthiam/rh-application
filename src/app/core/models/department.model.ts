export interface Department {
  id: number;
  name: string;
  description?: string;
  managerId: number;
  managerName: string;
  createdAt: Date;
  employeeCount: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  managerId: number;
}

export interface UpdateDepartmentRequest {
  name: string;
  description?: string;
  managerId: number;
}