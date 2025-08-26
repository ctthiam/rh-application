// src/app/features/departments/departments.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Material Modules
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { Department } from '../../core/models/department.model';
import { User, UserRole } from '../../core/models/user.model';
import { ConfirmDeleteDialog } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="departments-container" [@slideInUp]>
      <!-- Header avec actions -->
      <mat-card class="header-card" appearance="outlined">
        <mat-card-content>
          <div class="header-content">
            <div class="title-section">
              <h1 class="page-title">
                <mat-icon>domain</mat-icon>
                Gestion des Départements
              </h1>
              <p class="page-subtitle">
                {{ totalDepartments }} département(s) • {{ totalEmployees }} employé(s)
              </p>
            </div>
            
            <div class="actions-section" *ngIf="canCreateDepartments">
              <button
                mat-raised-button
                color="primary"
                (click)="createDepartment()"
                [disabled]="isLoading"
                class="create-button">
                <mat-icon>add</mat-icon>
                Nouveau Département
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Filtres et recherche -->
      <mat-card class="filters-card" appearance="outlined">
        <mat-card-content>
          <form [formGroup]="filtersForm" class="filters-form">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher un département</mat-label>
              <input
                matInput
                formControlName="search"
                placeholder="Nom, description, manager..."
                autocomplete="off">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <div class="filter-actions">
              <button
                mat-button
                type="button"
                (click)="clearFilters()"
                [disabled]="isLoading">
                <mat-icon>clear</mat-icon>
                Réinitialiser
              </button>
              
              <button
                mat-icon-button
                (click)="refreshData()"
                [disabled]="isLoading"
                matTooltip="Actualiser">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Table des départements -->
      <mat-card class="table-card" appearance="outlined">
        <mat-card-content>
          <!-- Barre de progression -->
          <mat-progress-bar 
            mode="indeterminate" 
            *ngIf="isLoading"
            class="loading-bar">
          </mat-progress-bar>

          <div class="table-container">
            <table 
              mat-table 
              [dataSource]="dataSource" 
              matSort
              class="departments-table">
              
              <!-- Colonne Nom -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>
                  Nom du Département
                </th>
                <td mat-cell *matCellDef="let dept" class="name-cell">
                  <div class="department-name">
                    <mat-icon class="dept-icon">domain</mat-icon>
                    <span class="name">{{ dept.name }}</span>
                  </div>
                  <div class="department-description" *ngIf="dept.description">
                    {{ dept.description }}
                  </div>
                </td>
              </ng-container>

              <!-- Colonne Manager -->
              <ng-container matColumnDef="manager">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="managerName">
                  Responsable
                </th>
                <td mat-cell *matCellDef="let dept" class="manager-cell">
                  <div class="manager-info">
                    <mat-icon class="manager-icon">person</mat-icon>
                    <span class="manager-name">{{ dept.managerName }}</span>
                  </div>
                  <mat-chip class="manager-chip" color="accent">
                    Manager
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Colonne Employés -->
              <ng-container matColumnDef="employees">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="employeeCount">
                  Employés
                </th>
                <td mat-cell *matCellDef="let dept" class="employees-cell">
                  <div class="employee-count">
                    <mat-chip 
                      [color]="getEmployeeCountColor(dept.employeeCount)"
                      class="count-chip">
                      <mat-icon>people</mat-icon>
                      {{ dept.employeeCount }}
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- Colonne Date de création -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>
                  Créé le
                </th>
                <td mat-cell *matCellDef="let dept" class="date-cell">
                  {{ dept.createdAt | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <!-- Colonne Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-header">
                  Actions
                </th>
                <td mat-cell *matCellDef="let dept" class="actions-cell">
                  <button
                    mat-icon-button
                    [matMenuTriggerFor]="actionsMenu"
                    [matMenuTriggerData]="{ department: dept }"
                    matTooltip="Actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr 
                mat-row 
                *matRowDef="let dept; columns: displayedColumns;"
                (click)="viewDepartment(dept)"
                class="department-row">
              </tr>
            </table>

            <!-- Message si aucune donnée -->
            <div class="no-data" *ngIf="!isLoading && dataSource.data.length === 0">
              <mat-icon class="no-data-icon">domain</mat-icon>
              <h3>Aucun département trouvé</h3>
              <p>{{ hasFilters ? 'Essayez de modifier vos filtres' : 'Commencez par créer un département' }}</p>
              <button 
                mat-raised-button 
                color="primary" 
                (click)="createDepartment()"
                *ngIf="canCreateDepartments && !hasFilters">
                <mat-icon>add</mat-icon>
                Créer le premier département
              </button>
            </div>
          </div>

          <!-- Pagination -->
          <mat-paginator
            [pageSize]="pageSize"
            [pageSizeOptions]="pageSizeOptions"
            [showFirstLastButtons]="true"
            [length]="totalDepartments"
            class="departments-paginator">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Menu contextuel -->
    <mat-menu #actionsMenu="matMenu">
      <ng-template matMenuContent let-department="department">
        <button mat-menu-item (click)="viewDepartment(department)">
          <mat-icon>visibility</mat-icon>
          <span>Voir les détails</span>
        </button>
        
        <button 
          mat-menu-item 
          (click)="editDepartment(department)"
          *ngIf="canEditDepartments">
          <mat-icon>edit</mat-icon>
          <span>Modifier</span>
        </button>
        
        <button 
          mat-menu-item 
          (click)="viewEmployees(department)">
          <mat-icon>people</mat-icon>
          <span>Voir les employés</span>
        </button>
        
        <mat-divider *ngIf="canDeleteDepartments"></mat-divider>
        
        <button 
          mat-menu-item 
          (click)="deleteDepartment(department)"
          *ngIf="canDeleteDepartments"
          class="delete-action">
          <mat-icon>delete</mat-icon>
          <span>Supprimer</span>
        </button>
      </ng-template>
    </mat-menu>
  `,
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data source et colonnes
  dataSource = new MatTableDataSource<Department>();
  displayedColumns: string[] = ['name', 'manager', 'employees', 'createdAt', 'actions'];

  // État du composant
  isLoading = false;
  totalDepartments = 0;
  totalEmployees = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  hasFilters = false;

  // Utilisateur actuel et permissions
  currentUser: User | null = null;
  canCreateDepartments = false;
  canEditDepartments = false;
  canDeleteDepartments = false;

  // Formulaire de filtres
  filtersForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.setupPermissions();
    this.setupFilters();
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configuration du filtre personnalisé
    this.dataSource.filterPredicate = (data: Department, filter: string) => {
      const searchTerm = filter.toLowerCase().trim();
      return (
        data.name.toLowerCase().includes(searchTerm) ||
        data.managerName.toLowerCase().includes(searchTerm) ||
        (data.description?.toLowerCase().includes(searchTerm) || false)
      );
    };
  }

  private setupPermissions(): void {
    if (!this.currentUser) return;

    switch (this.currentUser.role) {
      case UserRole.ADMIN:
        this.canCreateDepartments = true;
        this.canEditDepartments = true;
        this.canDeleteDepartments = true;
        break;
      case UserRole.MANAGER:
        this.canCreateDepartments = false;
        this.canEditDepartments = false;
        this.canDeleteDepartments = false;
        break;
      default:
        break;
    }
  }

  private setupFilters(): void {
    // Écoute des changements dans le champ de recherche
    this.filtersForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.applyFilters();
      });
  }

  private loadDepartments(): void {
    this.isLoading = true;

    this.departmentService.getDepartmentsWithStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.dataSource.data = departments;
          this.totalDepartments = departments.length;
          this.totalEmployees = departments.reduce((sum, dept) => sum + dept.employeeCount, 0);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des départements:', error);
          this.snackBar.open('Erreur lors du chargement des départements', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
  }

  private applyFilters(): void {
    const searchValue = this.filtersForm.get('search')?.value || '';
    this.dataSource.filter = searchValue;
    this.hasFilters = searchValue.trim().length > 0;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.dataSource.filter = '';
    this.hasFilters = false;
  }

  refreshData(): void {
    this.loadDepartments();
  }

  createDepartment(): void {
    this.router.navigate(['/departments/create']);
  }

  viewDepartment(department: Department): void {
    this.router.navigate(['/departments', department.id]);
  }

  editDepartment(department: Department): void {
    this.router.navigate(['/departments', department.id, 'edit']);
  }

  viewEmployees(department: Department): void {
    this.router.navigate(['/employees'], { 
      queryParams: { departmentId: department.id } 
    });
  }

  deleteDepartment(department: Department): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: {
        title: 'Supprimer le département',
        message: `Êtes-vous sûr de vouloir supprimer le département "${department.name}" ?`,
        warning: 'Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDelete(department);
      }
    });
  }

  private performDelete(department: Department): void {
    this.departmentService.deleteDepartment(department.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Département supprimé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadDepartments();
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

  getEmployeeCountColor(count: number): 'primary' | 'accent' | 'warn' {
    if (count === 0) return 'warn';
    if (count <= 5) return 'accent';
    return 'primary';
  }
}