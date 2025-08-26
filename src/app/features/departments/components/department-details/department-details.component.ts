// src/app/features/departments/components/department-details/department-details.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DepartmentService } from '../../../../core/services/department.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Department } from '../../../../core/models/department.model';
import { Employee } from '../../../../core/models/employee.model';
import { ConfirmDeleteDialog } from '../../../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { User, UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-department-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="department-details-container" [@slideInUp]>
      <!-- Header avec navigation -->
      <mat-card class="header-card" appearance="outlined">
        <mat-card-content>
          <div class="header-content">
            <button
              mat-icon-button
              (click)="goBack()"
              class="back-button"
              matTooltip="Retour à la liste">
              <mat-icon>arrow_back</mat-icon>
            </button>
            
            <div class="title-section" *ngIf="department">
              <h1 class="page-title">
                <mat-icon>domain</mat-icon>
                {{ department.name }}
              </h1>
              <p class="page-subtitle">
                Géré par {{ department.managerName }} • {{ department.employeeCount }} employé(s)
              </p>
            </div>

            <div class="actions-section" *ngIf="department && canEdit">
              <button
                mat-button
                color="accent"
                (click)="editDepartment()"
                [disabled]="isLoading">
                <mat-icon>edit</mat-icon>
                Modifier
              </button>
              
              <button
                mat-button
                color="warn"
                (click)="deleteDepartment()"
                [disabled]="isLoading"
                *ngIf="canDelete">
                <mat-icon>delete</mat-icon>
                Supprimer
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Contenu principal -->
      <div class="content-container" *ngIf="!isLoading && department">
        <mat-tab-group class="department-tabs" animationDuration="300ms">
          
          <!-- Onglet Informations -->
          <mat-tab label="Informations">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="info-grid">
                  <!-- Informations générales -->
                  <mat-card class="info-card" appearance="outlined">
                    <mat-card-header>
                      <mat-icon mat-card-avatar>info</mat-icon>
                      <mat-card-title>Informations générales</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-item">
                        <label>Nom du département :</label>
                        <span class="value">{{ department.name }}</span>
                      </div>
                      
                      <div class="info-item" *ngIf="department.description">
                        <label>Description :</label>
                        <span class="value description">{{ department.description }}</span>
                      </div>
                      
                      <div class="info-item">
                        <label>Date de création :</label>
                        <span class="value">{{ department.createdAt | date:'dd/MM/yyyy à HH:mm' }}</span>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Responsable -->
                  <mat-card class="info-card" appearance="outlined">
                    <mat-card-header>
                      <mat-icon mat-card-avatar>person</mat-icon>
                      <mat-card-title>Responsable</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="manager-profile">
                        <div class="manager-avatar">
                          <mat-icon>account_circle</mat-icon>
                        </div>
                        <div class="manager-info">
                          <h3>{{ department.managerName }}</h3>
                          <mat-chip color="accent">Manager</mat-chip>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Statistiques -->
                  <mat-card class="info-card stats-card" appearance="outlined">
                    <mat-card-header>
                      <mat-icon mat-card-avatar>analytics</mat-icon>
                      <mat-card-title>Statistiques</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="stats-grid">
                        <div class="stat-item">
                          <div class="stat-value">{{ department.employeeCount }}</div>
                          <div class="stat-label">Employés</div>
                        </div>
                        
                        <div class="stat-item">
                          <div class="stat-value">{{ totalTasks }}</div>
                          <div class="stat-label">Tâches</div>
                        </div>
                        
                        <div class="stat-item">
                          <div class="stat-value">{{ completedTasksPercent }}%</div>
                          <div class="stat-label">Terminées</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Onglet Employés -->
          <mat-tab label="Employés">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="employees-header">
                  <h3>Employés du département</h3>
                  <button
                    mat-raised-button
                    color="primary"
                    (click)="addEmployee()"
                    *ngIf="canEdit">
                    <mat-icon>person_add</mat-icon>
                    Ajouter un employé
                  </button>
                </div>

                <mat-card *ngIf="employees.length > 0" appearance="outlined">
                  <mat-card-content>
                    <table mat-table [dataSource]="employeesDataSource" class="employees-table">
                      
                      <!-- Colonne Nom -->
                      <ng-container matColumnDef="fullName">
                        <th mat-header-cell *matHeaderCellDef>Nom complet</th>
                        <td mat-cell *matCellDef="let emp" class="name-cell">
                          <div class="employee-info">
                            <mat-icon class="employee-icon">person</mat-icon>
                            <span class="name">{{ emp.fullName }}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Colonne Poste -->
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>Poste</th>
                        <td mat-cell *matCellDef="let emp">
                          <mat-chip color="primary">{{ emp.position }}</mat-chip>
                        </td>
                      </ng-container>

                      <!-- Colonne Embauche -->
                      <ng-container matColumnDef="hireDate">
                        <th mat-header-cell *matHeaderCellDef>Embauché le</th>
                        <td mat-cell *matCellDef="let emp">
                          {{ emp.hireDate | date:'dd/MM/yyyy' }}
                        </td>
                      </ng-container>

                      <!-- Colonne Actions -->
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>Actions</th>
                        <td mat-cell *matCellDef="let emp" class="actions-cell">
                          <button
                            mat-icon-button
                            (click)="viewEmployee(emp)"
                            matTooltip="Voir les détails">
                            <mat-icon>visibility</mat-icon>
                          </button>
                          
                          <button
                            mat-icon-button
                            (click)="editEmployee(emp)"
                            matTooltip="Modifier"
                            *ngIf="canEdit">
                            <mat-icon>edit</mat-icon>
                          </button>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="employeeColumns"></tr>
                      <tr mat-row *matRowDef="let emp; columns: employeeColumns;" class="employee-row"></tr>
                    </table>
                  </mat-card-content>
                </mat-card>

                <!-- Message si aucun employé -->
                <div class="no-employees" *ngIf="employees.length === 0 && !isLoadingEmployees">
                  <mat-icon class="no-data-icon">people</mat-icon>
                  <h3>Aucun employé dans ce département</h3>
                  <p>Commencez par ajouter des employés à ce département</p>
                  <button
                    mat-raised-button
                    color="primary"
                    (click)="addEmployee()"
                    *ngIf="canEdit">
                    <mat-icon>person_add</mat-icon>
                    Ajouter le premier employé
                  </button>
                </div>
              </div>
            </ng-template>
          </mat-tab>

        </mat-tab-group>
      </div>

      <!-- État de chargement -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-card appearance="outlined">
          <mat-card-content>
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <p class="loading-text">Chargement des informations du département...</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- État d'erreur -->
      <div class="error-container" *ngIf="!isLoading && !department">
        <mat-card appearance="outlined">
          <mat-card-content class="error-content">
            <mat-icon class="error-icon">error</mat-icon>
            <h2>Département introuvable</h2>
            <p>Le département demandé n'existe pas ou a été supprimé.</p>
            <button mat-raised-button color="primary" (click)="goBack()">
              Retour à la liste
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['department-details.component.scss']
})
export class DepartmentDetailsComponent implements OnInit, OnDestroy {
  department: Department | null = null;
  employees: Employee[] = [];
  employeesDataSource = new MatTableDataSource<Employee>();
  employeeColumns = ['fullName', 'position', 'hireDate', 'actions'];
  
  isLoading = false;
  isLoadingEmployees = false;
  totalTasks = 0;
  completedTasksPercent = 0;
  
  // Permissions
  currentUser: User | null = null;
  canEdit = false;
  canDelete = false;

  private destroy$ = new Subject<void>();
  private departmentId: number;

  constructor(
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.departmentId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.setupPermissions();
    this.loadDepartmentData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPermissions(): void {
    if (!this.currentUser) return;

    this.canEdit = this.currentUser.role === UserRole.ADMIN;
    this.canDelete = this.currentUser.role === UserRole.ADMIN;
  }

  private loadDepartmentData(): void {
    this.isLoading = true;

    forkJoin([
      this.departmentService.getDepartmentById(this.departmentId),
      this.employeeService.getEmployeesByDepartment(this.departmentId)
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([department, employees]) => {
        this.department = department;
        this.employees = employees;
        this.employeesDataSource.data = employees;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.isLoading = false;
      }
    });
  }

  private calculateStats(): void {
    // Simulation des statistiques des tâches
    this.totalTasks = this.employees.length * 3; // Moyenne de 3 tâches par employé
    this.completedTasksPercent = Math.floor(Math.random() * 30) + 70; // Entre 70% et 100%
  }

  editDepartment(): void {
    this.router.navigate(['/departments', this.departmentId, 'edit']);
  }

  deleteDepartment(): void {
    if (!this.department) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: {
        title: 'Supprimer le département',
        message: `Êtes-vous sûr de vouloir supprimer le département "${this.department.name}" ?`,
        warning: 'Tous les employés seront réassignés. Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.department) {
        this.performDelete();
      }
    });
  }

  private performDelete(): void {
    this.departmentService.deleteDepartment(this.departmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Département supprimé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/departments']);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.snackBar.open('Erreur lors de la suppression du département', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  addEmployee(): void {
    this.router.navigate(['/employees/create'], {
      queryParams: { departmentId: this.departmentId }
    });
  }

  viewEmployee(employee: Employee): void {
    this.router.navigate(['/employees', employee.id]);
  }

  editEmployee(employee: Employee): void {
    this.router.navigate(['/employees', employee.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/departments']);
  }
}
