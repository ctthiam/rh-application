// src/app/features/dashboard/components/admin-dashboard/admin-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>admin_panel_settings</mat-icon>
            Dashboard Administrateur
          </mat-card-title>
          <mat-card-subtitle>
            Bienvenue, {{ currentUser?.fullName }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p>Vous êtes connecté en tant qu'administrateur.</p>
          <p>Ici vous pouvez gérer tous les aspects de l'application.</p>
          
          <!-- Statistiques rapides -->
          <div class="stats-grid">
            <mat-card class="stat-card">
              <mat-icon>people</mat-icon>
              <h3>Utilisateurs</h3>
              <p class="stat-number">25</p>
            </mat-card>
            
            <mat-card class="stat-card">
              <mat-icon>business</mat-icon>
              <h3>Départements</h3>
              <p class="stat-number">8</p>
            </mat-card>
            
            <mat-card class="stat-card">
              <mat-icon>assignment</mat-icon>
              <h3>Tâches actives</h3>
              <p class="stat-number">142</p>
            </mat-card>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary">
            <mat-icon>settings</mat-icon>
            Configuration système
          </button>
          <button mat-raised-button>
            <mat-icon>people</mat-icon>
            Gérer les utilisateurs
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    
    .stat-card {
      text-align: center;
      padding: 20px;
    }
    
    .stat-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
    }
    
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
      color: #3f51b5;
    }
    
    mat-card-header mat-icon {
      margin-right: 8px;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('AdminDashboard chargé pour:', this.currentUser?.fullName);
  }
}