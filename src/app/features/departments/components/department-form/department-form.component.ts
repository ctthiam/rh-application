// src/app/features/departments/components/department-form/department-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { DepartmentService } from '../../../../core/services/department.service';
import { UserService } from '../../../../core/services/user.service';
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '../../../../core/models/department.model';
import { User, UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="department-form-container" [@slideInUp]>
      <!-- Header -->
      <mat-card class="header-card" appearance="outlined">
        <mat-card-content>
          <div class="header-content">
            <button
              mat-icon-button
              (click)="goBack()"
              class="back-button"
              matTooltip="Retour">
              <mat-icon>arrow_back</mat-icon>
            </button>
            
            <div class="title-section">
              <h1 class="page-title">
                <mat-icon>{{ isEditMode ? 'edit' : 'add' }}</mat-icon>
                {{ isEditMode ? 'Modifier le département' : 'Nouveau département' }}
              </h1>
              <p class="page-subtitle" *ngIf="isEditMode && currentDepartment">
                {{ currentDepartment.name }}
              </p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Formulaire -->
      <mat-card class="form-card" appearance="outlined">
        <mat-card-content>
          <mat-progress-bar 
            mode="indeterminate" 
            *ngIf="isLoading"
            class="loading-bar">
          </mat-progress-bar>

          <form [formGroup]="departmentForm" (ngSubmit)="onSubmit()" class="department-form">
            <!-- Informations générales -->
            <div class="form-section">
              <h3 class="section-title">
                <mat-icon>info</mat-icon>
                Informations générales
              </h3>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nom du département *</mat-label>
                  <input
                    matInput
                    formControlName="name"
                    placeholder="Ex: Ressources Humaines"
                    maxlength="100"
                    autocomplete="off">
                  <mat-hint align="end">
                    {{ departmentForm.get('name')?.value?.length || 0 }}/100
                  </mat-hint>
                  <mat-error *ngIf="departmentForm.get('name')?.hasError('required')">
                    Le nom du département est obligatoire
                  </mat-error>
                  <mat-error *ngIf="departmentForm.get('name')?.hasError('minlength')">
                    Le nom doit contenir au moins 3 caractères
                  </mat-error>
                  <mat-error *ngIf="departmentForm.get('name')?.hasError('maxlength')">
                    Le nom ne peut pas dépasser 100 caractères
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea
                    matInput
                    formControlName="description"
                    placeholder="Description des missions et responsabilités du département"
                    rows="4"
                    maxlength="500">
                  </textarea>
                  <mat-hint align="end">
                    {{ departmentForm.get('description')?.value?.length || 0 }}/500
                  </mat-hint>
                  <mat-error *ngIf="departmentForm.get('description')?.hasError('maxlength')">
                    La description ne peut pas dépasser 500 caractères
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <!-- Responsable -->
            <div class="form-section">
              <h3 class="section-title">
                <mat-icon>person</mat-icon>
                Responsable du département
              </h3>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Manager responsable *</mat-label>
                  <mat-select formControlName="managerId" [compareWith]="compareManagers">
                    <mat-option value="">Sélectionner un manager</mat-option>
                    <mat-option 
                      *ngFor="let manager of availableManagers" 
                      [value]="manager.id"
                      class="manager-option">
                      <div class="manager-info">
                        <span class="manager-name">{{ manager.fullName }}</span>
                        <span class="manager-email">{{ manager.email }}</span>
                      </div>
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="departmentForm.get('managerId')?.hasError('required')">
                    Vous devez sélectionner un manager
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Info sur le manager sélectionné -->
              <div class="selected-manager-info" *ngIf="selectedManager">
                <mat-icon class="info-icon">info</mat-icon>
                <div class="manager-details">
                  <p class="manager-name">{{ selectedManager.fullName }}</p>
                  <p class="manager-role">{{ selectedManager.email }}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button
                type="button"
                mat-button
                (click)="goBack()"
                [disabled]="isSubmitting">
                Annuler
              </button>
              
              <button
                type="submit"
                mat-raised-button
                color="primary"
                [disabled]="departmentForm.invalid || isSubmitting"
                class="submit-button">
                <mat-icon *ngIf="!isSubmitting">
                  {{ isEditMode ? 'save' : 'add' }}
                </mat-icon>
                <span *ngIf="!isSubmitting">
                  {{ isEditMode ? 'Modifier' : 'Créer' }}
                </span>
                <span *ngIf="isSubmitting">
                  {{ isEditMode ? 'Modification...' : 'Création...' }}
                </span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./department-form.component.scss']
})
export class DepartmentFormComponent implements OnInit, OnDestroy {
  departmentForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  
  currentDepartment: Department | null = null;
  availableManagers: User[] = [];
  selectedManager: User | null = null;

  private destroy$ = new Subject<void>();
  private departmentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.departmentForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkMode();
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]],
      managerId: ['', [Validators.required]]
    });
  }

  private checkMode(): void {
    this.departmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.departmentId && this.departmentId > 0;
  }

  private loadInitialData(): void {
  this.isLoading = true;

  if (this.isEditMode && this.departmentId) {
    // Mode édition : charger les managers ET le département
    forkJoin({
      managers: this.userService.getUsersByRole(UserRole.MANAGER),
      department: this.departmentService.getDepartmentById(this.departmentId)
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (results) => {
        this.availableManagers = results.managers;
        this.currentDepartment = results.department;
        this.populateForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  } else {
    // Mode création : charger seulement les managers
    this.userService.getUsersByRole(UserRole.MANAGER)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (managers) => {
          this.availableManagers = managers;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des managers:', error);
          this.snackBar.open('Erreur lors du chargement des managers', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
  }
}

  private populateForm(): void {
    if (!this.currentDepartment) return;

    this.departmentForm.patchValue({
      name: this.currentDepartment.name,
      description: this.currentDepartment.description,
      managerId: this.currentDepartment.managerId
    });
  }

  private setupFormSubscriptions(): void {
    // Écoute des changements du manager sélectionné
    this.departmentForm.get('managerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(managerId => {
        this.selectedManager = this.availableManagers.find(m => m.id === managerId) || null;
      });
  }

  compareManagers(m1: number, m2: number): boolean {
    return m1 === m2;
  }

  onSubmit(): void {
    if (this.departmentForm.valid) {
      this.isSubmitting = true;

      const formData = this.departmentForm.value;
      
      if (this.isEditMode && this.departmentId) {
        this.updateDepartment(formData);
      } else {
        this.createDepartment(formData);
      }
    }
  }

  private createDepartment(formData: any): void {
    const request: CreateDepartmentRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      managerId: formData.managerId
    };

    this.departmentService.createDepartment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (department) => {
          this.snackBar.open('Département créé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/departments', department.id]);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.snackBar.open('Erreur lors de la création du département', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
  }

  private updateDepartment(formData: any): void {
    const request: UpdateDepartmentRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      managerId: formData.managerId
    };

    this.departmentService.updateDepartment(this.departmentId!, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (department) => {
          this.snackBar.open('Département modifié avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/departments', department.id]);
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.snackBar.open('Erreur lors de la modification du département', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
  }

  goBack(): void {
    if (this.isEditMode && this.departmentId) {
      this.router.navigate(['/departments', this.departmentId]);
    } else {
      this.router.navigate(['/departments']);
    }
  }
}