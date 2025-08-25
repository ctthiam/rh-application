import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="access-denied-container">
      <mat-card class="error-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="error-icon">block</mat-icon>
          <mat-card-title>Accès refusé</mat-card-title>
          <mat-card-subtitle>Erreur 403</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p>Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
          <p>Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.</p>
        </mat-card-content>
        
        <mat-card-actions MatCardActions.align="center">
          <button mat-raised-button color="primary" routerLink="/dashboard">
            <mat-icon>home</mat-icon>
            Retour à l'accueil
          </button>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Retour
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .error-card {
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .error-icon {
      background: #ff9800;
      color: white;
    }

    mat-card-actions {
      padding: 16px;
    }

    mat-card-actions button {
      margin: 0 8px;
    }
  `]
})
export class AccessDeniedComponent {
  
  goBack(): void {
    window.history.back();
  }
}