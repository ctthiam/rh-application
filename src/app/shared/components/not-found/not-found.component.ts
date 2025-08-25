import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="not-found-container">
      <mat-card class="error-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="error-icon">error_outline</mat-icon>
          <mat-card-title>Page non trouvée</mat-card-title>
          <mat-card-subtitle>Erreur 404</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
          <p>Veuillez vérifier l'URL ou retourner à la page d'accueil.</p>
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
    .not-found-container {
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
      background: #f44336;
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
export class NotFoundComponent {
  
  goBack(): void {
    window.history.back();
  }
}