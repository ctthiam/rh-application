// src/app/shared/components/navbar/navbar.component.ts (mise à jour avec navigation départements)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="navbar-title" (click)="navigateToHome()">
        <mat-icon>business</mat-icon>
        Application RH
      </span>
      
      <!-- Menu de navigation -->
      <div class="navigation-menu" *ngIf="currentUser">
        <button
          mat-button
          [routerLink]="getDashboardRoute()"
          routerLinkActive="active-nav">
          <mat-icon>dashboard</mat-icon>
          Dashboard
        </button>
        
        <button
          mat-button
          routerLink="/employees"
          routerLinkActive="active-nav"
          *ngIf="canAccessEmployees">
          <mat-icon>people</mat-icon>
          Employés
        </button>
        
        <button
          mat-button
          routerLink="/departments"
          routerLinkActive="active-nav"
          *ngIf="canAccessDepartments">
          <mat-icon>domain</mat-icon>
          Départements
        </button>
        
        <button
          mat-button
          routerLink="/tasks"
          routerLinkActive="active-nav">
          <mat-icon>assignment</mat-icon>
          Tâches
        </button>
      </div>
      
      <span class="navbar-spacer"></span>
      
      <div class="user-info" *ngIf="currentUser">
        <mat-icon>person</mat-icon>
        <span class="user-name">{{ currentUser.fullName }}</span>
        <mat-chip class="role-chip" [color]="getRoleColor(currentUser.role)">
          {{ getRoleDisplayName(currentUser.role) }}
        </mat-chip>
      </div>
      
      <button mat-icon-button [matMenuTriggerFor]="userMenu" *ngIf="currentUser">
        <mat-icon>more_vert</mat-icon>
      </button>
      
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="navigateToDashboard()">
          <mat-icon>dashboard</mat-icon>
          <span>Dashboard</span>
        </button>
        <button mat-menu-item (click)="navigateToProfile()">
          <mat-icon>account_circle</mat-icon>
          <span>Profil</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()" class="logout-button">
          <mat-icon>logout</mat-icon>
          <span>Se déconnecter</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  canAccessEmployees = false;
  canAccessDepartments = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updatePermissions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePermissions(): void {
    if (!this.currentUser) {
      this.canAccessEmployees = false;
      this.canAccessDepartments = false;
      return;
    }

    switch (this.currentUser.role) {
      case UserRole.ADMIN:
        this.canAccessEmployees = true;
        this.canAccessDepartments = true;
        break;
      case UserRole.MANAGER:
        this.canAccessEmployees = true;
        this.canAccessDepartments = true; // Lecture seule
        break;
      case UserRole.EMPLOYE:
        this.canAccessEmployees = false;
        this.canAccessDepartments = false;
        break;
    }
  }

  getDashboardRoute(): string {
    if (!this.currentUser) return '/dashboard';

    switch (this.currentUser.role) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.MANAGER:
        return '/dashboard/manager';
      case UserRole.EMPLOYE:
        return '/dashboard/employee';
      default:
        return '/dashboard';
    }
  }

  getRoleColor(role: UserRole): 'primary' | 'accent' | 'warn' {
    switch (role) {
      case UserRole.ADMIN:
        return 'warn';
      case UserRole.MANAGER:
        return 'accent';
      case UserRole.EMPLOYE:
        return 'primary';
      default:
        return 'primary';
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
        return 'Utilisateur';
    }
  }

  navigateToHome(): void {
    if (this.currentUser) {
      this.router.navigate([this.getDashboardRoute()]);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  navigateToDashboard(): void {
    this.router.navigate([this.getDashboardRoute()]);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}