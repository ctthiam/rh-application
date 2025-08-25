export interface Employee {
  id: number;
  fullName: string;
  position: string;
  hireDate: Date;
  salary: number;
  email: string;
  phone?: string;
  departmentId: number;
  departmentName: string;
  userId?: number;
  userLogin?: string;
  createdAt: Date;
  taskCount: number;
}

export interface CreateEmployeeRequest {
  fullName: string;
  position: string;
  hireDate: Date;
  salary: number;
  email: string;
  phone?: string;
  departmentId: number;
  userId?: number;
}

export interface UpdateEmployeeRequest {
  fullName: string;
  position: string;
  hireDate: Date;
  salary: number;
  email: string;
  phone?: string;
  departmentId: number;
  userId?: number;
}