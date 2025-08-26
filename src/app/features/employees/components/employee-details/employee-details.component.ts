// src/app/features/employees/components/employee-details/employee-details.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';

import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Employee } from '../../../../core/models/employee.model';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatListModule
  ],
  template: `
    <div class="employee-details-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info" *ngIf="employee && !isLoading">
            <h1>{{ employee.fullName }}</h1>
            <p class="subtitle">{{ employee.position }} - {{ employee.departmentName }}</p>
          </div>
          <div class="header-actions" *ngIf="employee && !isLoading">
            <button mat-raised-button 
                    color="primary"
                    [routerLink]="['/employees', employee.id, 'edit']"
                    *ngIf="canEdit">
              <mat-icon>edit</mat-icon>
              Modifier
            </button>
            <button mat-icon-button [matMenuTriggerFor]="actionMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionMenu="matMenu">
              <button mat-menu-item (click)="viewTasks()">
                <mat-icon>assignment</mat-icon>
                <span>Voir les tâches</span>
              </button>
              <button mat-menu-item (click)="sendEmail()" *ngIf="employee?.email">
                <mat-icon>email</mat-icon>
                <span>Envoyer un email</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="deleteEmployee()" 
                      class="delete-action" *ngIf="canDelete">
                <mat-icon>delete</mat-icon>
                <span>Supprimer</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement des détails de l'employé...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="hasError && !isLoading">
        <mat-icon>error_outline</mat-icon>
        <h2>Employé introuvable</h2>
        <p>L'employé demandé n'existe pas ou vous n'avez pas les permissions pour le voir.</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          Retour à la liste
        </button>
      </div>

      <!-- Content -->
      <div class="details-content" *ngIf="employee && !isLoading">
        
        <!-- Profile Card -->
        <div class="profile-section">
          <mat-card class="profile-card">
            <mat-card-content>
              <div class="profile-header">
                <div class="profile-avatar">
                  <mat-icon>account_circle</mat-icon>
                </div>
                <div class="profile-info">
                  <h2>{{ employee.fullName }}</h2>
                  <p class="position">{{ employee.position }}</p>
                  <mat-chip-set>
                    <mat-chip color="primary" selected>
                      <mat-icon matChipAvatar>domain</mat-icon>
                      {{ employee.departmentName }}
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>
              
              <mat-divider class="profile-divider"></mat-divider>
              
              <div class="quick-stats">
                <div class="stat-item">
                  <mat-icon>event</mat-icon>
                  <div class="stat-content">
                    <span class="stat-label">Embauche</span>
                    <span class="stat-value">{{ employee.hireDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
                
                <div class="stat-item">
                  <mat-icon>euro</mat-icon>
                  <div class="stat-content">
                    <span class="stat-label">Salaire</span>
                    <span class="stat-value">{{ employee.salary | currency:'EUR':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
                
                <div class="stat-item">
                  <mat-icon>assignment</mat-icon>
                  <div class="stat-content">
                    <span class="stat-label">Tâches</span>
                    <span class="stat-value">{{ employee.taskCount }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Detailed Information Tabs -->
        <div class="tabs-section">
          <mat-card>
            <mat-tab-group animationDuration="300ms">
              
              <!-- Informations personnelles -->
              <mat-tab label="Informations personnelles">
                <div class="tab-content">
                  <div class="info-grid">
                    <div class="info-item">
                      <mat-icon>person</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Nom complet</span>
                        <span class="info-value">{{ employee.fullName }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>email</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Email</span>
                        <span class="info-value">
                          <a [href]="'mailto:' + employee.email">{{ employee.email }}</a>
                        </span>
                      </div>
                    </div>

                    <div class="info-item" *ngIf="employee.phone">
                      <mat-icon>phone</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Téléphone</span>
                        <span class="info-value">
                          <a [href]="'tel:' + employee.phone">{{ employee.phone }}</a>
                        </span>
                      </div>
                    </div>

                    <div class="info-item" *ngIf="employee.userLogin">
                      <mat-icon>account_circle</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Identifiant</span>
                        <span class="info-value">{{ employee.userLogin }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- Informations professionnelles -->
              <mat-tab label="Informations professionnelles">
                <div class="tab-content">
                  <div class="info-grid">
                    <div class="info-item">
                      <mat-icon>work</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Poste</span>
                        <span class="info-value">{{ employee.position }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>domain</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Département</span>
                        <span class="info-value">{{ employee.departmentName }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>event</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Date d'embauche</span>
                        <span class="info-value">{{ employee.hireDate | date:'dd MMMM yyyy' }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>schedule</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Ancienneté</span>
                        <span class="info-value">{{ calculateSeniority() }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>euro</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Salaire annuel</span>
                        <span class="info-value">{{ employee.salary | currency:'EUR':'symbol':'1.0-0' }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>assignment</mat-icon>
                      <div class="info-content">
                        <span class="info-label">Tâches assignées</span>
                        <span class="info-value">{{ employee.taskCount }} tâche(s)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- Historique et activité -->
              <mat-tab label="Activité">
                <div class="tab-content">
                  <div class="activity-section">
                    <h3>
                      <mat-icon>history</mat-icon>
                      Historique récent
                    </h3>
                    <mat-list class="activity-list">
                      <mat-list-item>
                        <mat-icon matListItemIcon>person_add</mat-icon>
                        <div matListItemTitle>Employé créé</div>
                        <div matListItemLine>{{ employee.createdAt | date:'dd/MM/yyyy à HH:mm' }}</div>
                      </mat-list-item>
                      
                      <mat-list-item>
                        <mat-icon matListItemIcon>work</mat-icon>
                        <div matListItemTitle>Embauche</div>
                        <div matListItemLine>{{ employee.hireDate | date:'dd/MM/yyyy' }}</div>
                      </mat-list-item>
                      
                      <!-- Placeholder pour d'autres événements -->
                      <mat-list-item>
                        <mat-icon matListItemIcon>info</mat-icon>
                        <div matListItemTitle>Aucune autre activité récente</div>
                        <div matListItemLine>L'historique détaillé sera bientôt disponible</div>
                      </mat-list-item>
                    </mat-list>
                  </div>
                </div>
              </mat-tab>

            </mat-tab-group>
          </mat-card>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./employee-details.component.scss']
})
export class EmployeeDetailsComponent implements OnInit, OnDestroy {
  employee: Employee | null = null;
  employeeId: number | null = null;
  
  isLoading = false;
  hasError = false;
  
  canEdit = false;
  canDelete = false;

  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkPermissions();
    this.extractEmployeeId();
    this.loadEmployee();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Les permissions dépendent du rôle
    this.canEdit = this.authService.canManage();
    this.canDelete = this.authService.isAdmin();
  }

  private extractEmployeeId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      this.employeeId = Number(id);
    } else {
      this.hasError = true;
    }
  }

  private loadEmployee(): void {
    if (!this.employeeId) {
      this.hasError = true;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.employeeService.getEmployeeById(this.employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee) => {
          this.employee = employee;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'employé:', error);
          this.hasError = true;
          this.isLoading = false;
          
          this.snackBar.open('Erreur lors du chargement des détails', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  calculateSeniority(): string {
    if (!this.employee) return '';
    
    const hireDate = new Date(this.employee.hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    } else if (months > 0) {
      return `${months} mois`;
    } else {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  viewTasks(): void {
    if (this.employee) {
      this.router.navigate(['/tasks'], { 
        queryParams: { employeeId: this.employee.id }
      });
    }
  }

  sendEmail(): void {
    if (this.employee?.email) {
      window.location.href = `mailto:${this.employee.email}`;
    }
  }

  deleteEmployee(): void {
    if (!this.employee || !this.canDelete) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'employé "${this.employee.fullName}" ?
    
Cette action est irréversible et supprimera également :
- Toutes les tâches assignées à cet employé
- L'historique associé

Tapez "SUPPRIMER" pour confirmer :`;

    const confirmation = prompt(confirmMessage);
    if (confirmation === 'SUPPRIMER') {
      this.performDeleteEmployee();
    } else if (confirmation !== null) {
      this.snackBar.open('Suppression annulée - confirmation incorrecte', 'Fermer', {
        duration: 3000
      });
    }
  }

  private performDeleteEmployee(): void {
    if (!this.employee) return;

    this.employeeService.deleteEmployee(this.employee.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Employé supprimé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/employees']);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.snackBar.open('Erreur lors de la suppression de l\'employé', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
}