
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User, CreateUserRequest, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les utilisateurs (ADMIN uniquement)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des utilisateurs:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir un utilisateur par son ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer un nouvel utilisateur (ADMIN uniquement)
   */
  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création de l\'utilisateur:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer un utilisateur (ADMIN uniquement)
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression de l'utilisateur ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération du profil:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les utilisateurs par rôle
   */
  getUsersByRole(role: UserRole): Observable<User[]> {
    return this.getAllUsers().pipe(
      map(users => users.filter(user => user.role === role)),
      catchError(error => {
        console.error(`Erreur lors de la récupération des utilisateurs avec le rôle ${role}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtenir les managers pour les sélecteurs
   */
  getManagers(): Observable<User[]> {
    return this.getUsersByRole(UserRole.MANAGER).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des managers:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifier si un login existe déjà
   */
  checkLoginExists(login: string): Observable<boolean> {
    return this.getAllUsers().pipe(
      map(users => users.some(user => user.login === login)),
      catchError(error => {
        console.error('Erreur lors de la vérification du login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  getUserStats(): Observable<any> {
    return this.getAllUsers().pipe(
      map(users => ({
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === UserRole.ADMIN).length,
        managerCount: users.filter(u => u.role === UserRole.MANAGER).length,
        employeeCount: users.filter(u => u.role === UserRole.EMPLOYE).length
      })),
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques des utilisateurs:', error);
        return throwError(() => error);
      })
    );
  }
}