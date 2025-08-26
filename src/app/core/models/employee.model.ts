// src/app/core/models/employee.model.ts (corrigé)
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string; // Ajouté comme optionnel
  position: string;
  hireDate: Date;
  salary: number;
  departmentId: number;
  departmentName: string;
  userId?: number; // Ajouté pour la liaison avec User
  userLogin?: string; // Ajouté pour l'affichage
  taskCount?: number; // Ajouté pour les statistiques
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  fullName: string; // Ajouté
  email: string;
  phone?: string; // Ajouté comme optionnel
  position: string;
  hireDate: Date;
  salary: number;
  departmentId: number;
  password?: string;
}

export interface UpdateEmployeeRequest {
  firstName: string;
  lastName: string;
  fullName: string; // Ajouté
  email: string;
  phone?: string; // Ajouté comme optionnel
  position: string;
  hireDate: Date;
  salary: number;
  departmentId: number;
}

export interface EmployeeStats {
  totalEmployees: number;
  averageSalary: number;
  departmentDistribution: DepartmentEmployeeCount[];
  recentHires: Employee[];
}

export interface DepartmentEmployeeCount {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
}
