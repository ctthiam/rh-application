import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '../models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/department`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les départements
   */
  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des départements:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir un département par son ID
   */
  getDepartmentById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération du département ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer un nouveau département
   */
  createDepartment(department: CreateDepartmentRequest): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, department)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création du département:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Mettre à jour un département
   */
  updateDepartment(id: number, department: UpdateDepartmentRequest): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${id}`, department)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la mise à jour du département ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer un département
   */
  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression du département ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les départements avec le nombre d'employés
   */
  getDepartmentsWithStats(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/stats`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des statistiques des départements:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les départements gérés par un manager
   */
  getDepartmentsByManager(managerId: number): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/manager/${managerId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des départements du manager ${managerId}:`, error);
          return throwError(() => error);
        })
      );
  }
}