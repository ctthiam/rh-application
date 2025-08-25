import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/task`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir toutes les tâches
   */
  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des tâches:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir une tâche par son ID
   */
  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération de la tâche ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer une nouvelle tâche
   */
  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création de la tâche:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Mettre à jour une tâche
   */
  updateTask(id: number, task: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la mise à jour de la tâche ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer une tâche
   */
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression de la tâche ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Marquer une tâche comme terminée
   */
  completeTask(id: number): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${id}/complete`, {})
      .pipe(
        catchError(error => {
          console.error(`Erreur lors du marquage de la tâche ${id} comme terminée:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les tâches d'un employé
   */
  getTasksByEmployee(employeeId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/employee/${employeeId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des tâches de l'employé ${employeeId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les tâches par statut
   */
  getTasksByStatus(status: TaskStatus): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/status/${status}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des tâches avec le statut ${status}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les tâches d'un département
   */
  getTasksByDepartment(departmentId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/department/${departmentId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des tâches du département ${departmentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les tâches en retard
   */
  getOverdueTasks(): Observable<Task[]> {
    return this.getAllTasks().pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des tâches en retard:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Rechercher des tâches
   */
  searchTasks(searchTerm: string, filters?: any): Observable<Task[]> {
    let params = new HttpParams();
    
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    if (filters?.status) {
      params = params.set('status', filters.status.toString());
    }
    
    if (filters?.employeeId) {
      params = params.set('employeeId', filters.employeeId.toString());
    }
    
    if (filters?.departmentId) {
      params = params.set('departmentId', filters.departmentId.toString());
    }

    return this.http.get<Task[]>(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la recherche de tâches:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les statistiques des tâches
   */
  getTaskStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des statistiques des tâches:', error);
          return throwError(() => error);
        })
      );
  }
  // Dans task.service.ts
updateTaskStatus(taskId: number, status: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/tasks/${taskId}/status`, { status })
    .pipe(
      catchError(error => {
        console.error(`Erreur lors de la mise à jour du statut de la tâche ${taskId}:`, error);
        return throwError(() => error);
      })
    );
}
}