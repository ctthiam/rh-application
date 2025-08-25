import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User, UserRole, CreateUserRequest } from '../models/user.model';

interface JwtPayload {
  nameid: string;
  unique_name: string;
  email: string;
  // Propriétés avec les noms de claims Microsoft
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  FullName: string;
  exp: number;
  iss: string;
  aud: string;
  // Aussi gérer le cas où le rôle pourrait être dans 'role'
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      const user = this.getUserFromToken(token);
      if (user) {
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
      }
    } else {
      this.logout();
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          const user = this.getUserFromToken(response.token);
          if (user) {
            this.currentUserSubject.next(user);
            this.isLoggedInSubject.next(true);
          }
        }),
        catchError(error => {
          console.error('Erreur de connexion:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  getCurrentUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.role === role : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isManager(): boolean {
    return this.hasRole(UserRole.MANAGER);
  }

  isEmployee(): boolean {
    return this.hasRole(UserRole.EMPLOYE);
  }

  canManage(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER]);
  }

  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(environment.tokenKey, token);
  }

  private getUserFromToken(token: string): User | null {
    try {
      const payload: JwtPayload = jwtDecode(token);
      
      // Extraire le rôle depuis les claims Microsoft ou le claim standard
      const roleString = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
      
      console.log('Token décodé - Rôle trouvé:', roleString);
      console.log('Payload complet:', payload);
      
      if (!roleString) {
        console.error('Aucun rôle trouvé dans le token');
        return null;
      }

      const user: User = {
        id: parseInt(payload.nameid),
        login: payload.unique_name,
        email: payload.email,
        fullName: payload.FullName,
        role: this.mapStringToUserRole(roleString),
        createdAt: new Date()
      };

      console.log('Utilisateur créé depuis le token:', user);
      return user;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  private mapStringToUserRole(roleString: string): UserRole {
    if (!roleString) {
      console.warn('Rôle string undefined, attribution du rôle EMPLOYE par défaut');
      return UserRole.EMPLOYE;
    }

    const upperRole = roleString.toUpperCase().trim();
    console.log('Mapping du rôle:', roleString, '->', upperRole);

    switch (upperRole) {
      case 'ADMIN':
        return UserRole.ADMIN;
      case 'MANAGER':
        return UserRole.MANAGER;
      case 'EMPLOYE':
      case 'EMPLOYEE':
        return UserRole.EMPLOYE;
      default:
        console.warn('Rôle inconnu:', roleString, '- Attribution du rôle EMPLOYE par défaut');
        return UserRole.EMPLOYE;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload: JwtPayload = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.EMPLOYE:
        return 'Employé';
      default:
        return 'Inconnu';
    }
  }
}