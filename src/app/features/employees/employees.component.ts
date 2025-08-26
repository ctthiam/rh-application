
// 2. src/app/features/employees/employees.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Material Modules
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Employee } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    MatDividerModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatSelectModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="employees-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <mat-icon>people</mat-icon>
              Gestion des Employés
            </h1>
            <p class="subtitle">{{ employees.length }} employé(s) au total</p>
          </div>
          
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="openAddEmployeeDialog()" 
                    [disabled]="isLoading">
              <mat-icon>person_add</mat-icon>
              Ajouter un employé
            </button>
            <button mat-icon-button (click)="refreshEmployees()" [disabled]="isLoading"
                    matTooltip="Actualiser la liste">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field class="search-field" appearance="outline">
              <mat-label>Rechercher un employé</mat-label>
              <input matInput 
                     [formControl]="searchControl" 
                     placeholder="Nom, poste, email...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Département</mat-label>
              <mat-select [formControl]="departmentControl">
                <mat-option value="">Tous les départements</mat-option>
                <mat-option *ngFor="let dept of departments" [value]="dept.id">
                  {{ dept.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="clearFilters()" [disabled]="isLoading">
              <mat-icon>clear</mat-icon>
              Réinitialiser
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement des employés...</p>
      </div>

      <!-- Table -->
      <mat-card class="table-card" *ngIf="!isLoading">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="employees-table">
              
              <!-- Colonne Photo/Avatar -->
              <ng-container matColumnDef="avatar">
                <th mat-header-cell *matHeaderCellDef>Photo</th>
                <td mat-cell *matCellDef="let employee">
                  <div class="employee-avatar">
                    <mat-icon>account_circle</mat-icon>
                  </div>
                </td>
              </ng-container>

              <!-- Colonne Nom complet -->
              <ng-container matColumnDef="fullName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom complet</th>
                <td mat-cell *matCellDef="let employee">
                  <div class="employee-name">
                    <span class="name">{{ employee.fullName }}</span>
                    <span class="email">{{ employee.email }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Colonne Poste -->
              <ng-container matColumnDef="position">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Poste</th>
                <td mat-cell *matCellDef="let employee">{{ employee.position }}</td>
              </ng-container>

              <!-- Colonne Département -->
              <ng-container matColumnDef="department">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Département</th>
                <td mat-cell *matCellDef="let employee">
                  <mat-chip color="primary" selected>{{ employee.departmentName }}</mat-chip>
                </td>
              </ng-container>

              <!-- Colonne Date d'embauche -->
              <ng-container matColumnDef="hireDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Embauche</th>
                <td mat-cell *matCellDef="let employee">
                  {{ employee.hireDate | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <!-- Colonne Salaire -->
              <ng-container matColumnDef="salary">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Salaire</th>
                <td mat-cell *matCellDef="let employee">
                  {{ employee.salary | currency:'EUR':'symbol':'1.0-0' }}
                </td>
              </ng-container>

              <!-- Colonne Tâches -->
              <ng-container matColumnDef="taskCount">
                <th mat-header-cell *matHeaderCellDef>Tâches</th>
                <td mat-cell *matCellDef="let employee">
                  <mat-chip [color]="employee.taskCount > 0 ? 'accent' : 'basic'" selected>
                    {{ employee.taskCount }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Colonne Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let employee">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu" 
                          [disabled]="isLoading">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item (click)="viewEmployee(employee)">
                      <mat-icon>visibility</mat-icon>
                      <span>Voir détails</span>
                    </button>
                    <button mat-menu-item (click)="editEmployee(employee)">
                      <mat-icon>edit</mat-icon>
                      <span>Modifier</span>
                    </button>
                    <button mat-menu-item (click)="viewEmployeeTasks(employee)">
                      <mat-icon>assignment</mat-icon>
                      <span>Voir les tâches</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="deleteEmployee(employee)" 
                            class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Supprimer</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  class="employee-row"></tr>
            </table>

            <!-- Message si pas de données -->
            <div class="no-data" *ngIf="dataSource.data.length === 0">
              <mat-icon>people_outline</mat-icon>
              <h3>Aucun employé trouvé</h3>
              <p>{{ hasFilters() ? 'Aucun employé ne correspond aux critères de recherche.' : 'Commencez par ajouter des employés.' }}</p>
              <button mat-raised-button color="primary" (click)="openAddEmployeeDialog()" 
                      *ngIf="!hasFilters()">
                <mat-icon>person_add</mat-icon>
                Ajouter le premier employé
              </button>
            </div>
          </div>

          <!-- Pagination -->
          <mat-paginator #paginator
                         [length]="totalCount"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[10, 25, 50, 100]"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>

      <!-- FAB pour mobile -->
      <button mat-fab color="primary" class="fab-add" (click)="openAddEmployeeDialog()" 
              [class.hidden]="!isMobile || isLoading">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  employees: Employee[] = [];
  departments: Department[] = [];
  dataSource = new MatTableDataSource<Employee>();
  
  displayedColumns: string[] = [
    'avatar', 'fullName', 'position', 'department', 
    'hireDate', 'salary', 'taskCount', 'actions'
  ];
  
  isLoading = false;
  totalCount = 0;
  pageSize = 25;
  isMobile = false;

  // Form Controls pour les filtres
  searchControl = new FormControl('');
  departmentControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFilters();
    this.loadEmployees();
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Vérifier si l'utilisateur est admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/access-denied']);
      return;
    }

    // Détecter si on est sur mobile
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  private setupFilters(): void {
    // Recherche avec debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Filtre par département
    this.departmentControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadEmployees(): void {
    this.isLoading = true;
    
    this.employeeService.getAllEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.dataSource.data = employees;
          this.totalCount = employees.length;
          this.isLoading = false;
          
          // Configuration du tri et pagination
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          });
        },
        error: (error) => {
          console.error('Erreur lors du chargement des employés:', error);
          this.snackBar.open('Erreur lors du chargement des employés', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
  }

  loadDepartments(): void {
    // TODO: Implémenter quand le service des départements sera disponible
    this.departments = [
      { id: 1, name: 'IT', description: '', managerId: 1, managerName: '', createdAt: new Date(), employeeCount: 0 },
      { id: 2, name: 'RH', description: '', managerId: 2, managerName: '', createdAt: new Date(), employeeCount: 0 }
    ];
  }

  applyFilters(): void {
    let filteredData = [...this.employees];

    // Filtre de recherche
    const searchTerm = this.searchControl.value?.toLowerCase().trim();
    if (searchTerm) {
      filteredData = filteredData.filter(emp => 
        emp.fullName.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par département
    const departmentId = this.departmentControl.value;
    if (departmentId) {
    //  filteredData = filteredData.filter(emp => emp.departmentId === departmentId);
    }

    this.dataSource.data = filteredData;
    this.totalCount = filteredData.length;

    // Reset pagination
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.departmentControl.setValue('');
    this.dataSource.data = this.employees;
    this.totalCount = this.employees.length;
  }

  hasFilters(): boolean {
    return !!(this.searchControl.value || this.departmentControl.value);
  }

  refreshEmployees(): void {
    this.loadEmployees();
  }

  openAddEmployeeDialog(): void {
    // TODO: Implémenter le dialog d'ajout d'employé
    this.snackBar.open('Fonctionnalité à implémenter: Ajouter un employé', 'Fermer', {
      duration: 3000
    });
  }

  viewEmployee(employee: Employee): void {
    // TODO: Naviguer vers la page de détails
    this.router.navigate(['/employees', employee.id]);
  }

  editEmployee(employee: Employee): void {
    // TODO: Ouvrir le dialog d'édition
    this.snackBar.open(`Modification de ${employee.fullName} à implémenter`, 'Fermer', {
      duration: 3000
    });
  }

  viewEmployeeTasks(employee: Employee): void {
    // TODO: Naviguer vers les tâches de l'employé
    this.router.navigate(['/tasks'], { queryParams: { employeeId: employee.id } });
  }

  deleteEmployee(employee: Employee): void {
    // TODO: Implémenter la suppression avec confirmation
    const message = `Êtes-vous sûr de vouloir supprimer l'employé ${employee.fullName} ?`;
    if (confirm(message)) {
      this.snackBar.open(`Suppression de ${employee.fullName} à implémenter`, 'Fermer', {
        duration: 3000
      });
    }
  }
}