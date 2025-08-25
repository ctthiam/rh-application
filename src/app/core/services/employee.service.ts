import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../models/employee.model';
import { ApiResponse } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employee`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les employés
   */
  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des employés:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir un employé par son ID
   */
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération de l'employé ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer un nouvel employé
   */
  createEmployee(employee: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création de l\'employé:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Mettre à jour un employé
   */
  updateEmployee(id: number, employee: UpdateEmployeeRequest): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la mise à jour de l'employé ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer un employé
   */
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression de l'employé ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les employés d'un département
   */
  getEmployeesByDepartment(departmentId: number): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/department/${departmentId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des employés du département ${departmentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Rechercher des employés
   */
  searchEmployees(searchTerm: string): Observable<Employee[]> {
    const params = new HttpParams().set('search', searchTerm);
    
    return this.http.get<Employee[]>(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la recherche d\'employés:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les statistiques des employés
   */
  getEmployeeStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des statistiques:', error);
          return throwError(() => error);
        })
      );
  }
}