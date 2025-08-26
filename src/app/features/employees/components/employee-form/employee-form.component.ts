// src/app/features/employees/components/employee-form/employee-form.component.ts (corrections)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../../../core/models/employee.model';
import { Department } from '../../../../core/models/department.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="employee-form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon>{{ isEditMode ? 'edit' : 'person_add' }}</mat-icon>
            {{ getPageTitle() }}
          </h1>
        </div>
      </div>

      <!-- Loading overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
      </div>

      <!-- Form -->
      <div class="form-content" [class.loading]="isLoading">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              {{ getFormTitle() }}
            </mat-card-title>
            <mat-card-subtitle>
              {{ getFormSubtitle() }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" class="employee-form">
              
              <!-- Informations personnelles -->
              <div class="form-section">
                <h3 class="section-title">
                  <mat-icon>person</mat-icon>
                  Informations personnelles
                </h3>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nom complet *</mat-label>
                    <input matInput 
                           formControlName="fullName"
                           placeholder="Prénom Nom"
                           autocomplete="name">
                    <mat-icon matSuffix>person</mat-icon>
                    <mat-error *ngIf="employeeForm.get('fullName')?.hasError('required')">
                      Le nom complet est obligatoire
                    </mat-error>
                    <mat-error *ngIf="employeeForm.get('fullName')?.hasError('minlength')">
                      Le nom doit contenir au moins 2 caractères
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row two-columns">
                  <mat-form-field appearance="outline">
                    <mat-label>Email *</mat-label>
                    <input matInput 
                           formControlName="email"
                           type="email"
                           placeholder="nom@entreprise.com"
                           autocomplete="email">
                    <mat-icon matSuffix>email</mat-icon>
                    <mat-error *ngIf="employeeForm.get('email')?.hasError('required')">
                      L'email est obligatoire
                    </mat-error>
                    <mat-error *ngIf="employeeForm.get('email')?.hasError('email')">
                      Veuillez saisir un email valide
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Téléphone</mat-label>
                    <input matInput 
                           formControlName="phone"
                           type="tel"
                           placeholder="+33 1 23 45 67 89"
                           autocomplete="tel">
                    <mat-icon matSuffix>phone</mat-icon>
                  </mat-form-field>
                </div>
              </div>

              <!-- Informations professionnelles -->
              <div class="form-section">
                <h3 class="section-title">
                  <mat-icon>work</mat-icon>
                  Informations professionnelles
                </h3>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Poste *</mat-label>
                    <input matInput 
                           formControlName="position"
                           placeholder="Développeur, Manager, etc."
                           autocomplete="organization-title">
                    <mat-icon matSuffix>badge</mat-icon>
                    <mat-error *ngIf="employeeForm.get('position')?.hasError('required')">
                      Le poste est obligatoire
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row two-columns">
                  <mat-form-field appearance="outline">
                    <mat-label>Département *</mat-label>
                    <mat-select formControlName="departmentId">
                      <mat-option value="">Sélectionnez un département</mat-option>
                      <mat-option *ngFor="let dept of departments" [value]="dept.id">
                        {{ dept.name }}
                      </mat-option>
                    </mat-select>
                    <mat-icon matSuffix>domain</mat-icon>
                    <mat-error *ngIf="employeeForm.get('departmentId')?.hasError('required')">
                      Le département est obligatoire
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Date d'embauche *</mat-label>
                    <input matInput 
                           [matDatepicker]="hireDatePicker"
                           formControlName="hireDate"
                           readonly>
                    <mat-datepicker-toggle matSuffix [for]="hireDatePicker">
                      <mat-icon matDatepickerToggleIcon>calendar_today</mat-icon>
                    </mat-datepicker-toggle>
                    <mat-datepicker #hireDatePicker></mat-datepicker>
                    <mat-error *ngIf="employeeForm.get('hireDate')?.hasError('required')">
                      La date d'embauche est obligatoire
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Salaire *</mat-label>
                    <input matInput 
                           formControlName="salary"
                           type="number"
                           placeholder="0"
                           min="0">
                    <span matSuffix>€</span>
                    <mat-error *ngIf="employeeForm.get('salary')?.hasError('required')">
                      Le salaire est obligatoire
                    </mat-error>
                    <mat-error *ngIf="employeeForm.get('salary')?.hasError('min')">
                      Le salaire doit être positif
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </form>
          </mat-card-content>

          <mat-card-actions class="form-actions">
            <button mat-button 
                    type="button" 
                    (click)="goBack()"
                    [disabled]="isSubmitting">
              Annuler
            </button>
            <button mat-raised-button 
                    color="primary"
                    type="submit"
                    (click)="onSubmit()"
                    [disabled]="employeeForm.invalid || isSubmitting">
              <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
              <mat-icon *ngIf="!isSubmitting">{{ isEditMode ? 'save' : 'add' }}</mat-icon>
              {{ getSubmitButtonText() }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit, OnDestroy {
  employeeForm: FormGroup;
  departments: Department[] = [];
  
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  employeeId: number | null = null;
  currentEmployee: Employee | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.employeeForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.determineMode();
    this.loadDepartments();
    
    if (this.isEditMode) {
      this.loadEmployee();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthodes pour les textes avec accents
  getPageTitle(): string {
    return this.isEditMode ? 'Modifier un employé' : 'Ajouter un employé';
  }

  getFormTitle(): string {
    return this.isEditMode ? 'Modification de l\'employé' : 'Informations de l\'employé';
  }

  getFormSubtitle(): string {
    return this.isEditMode ? 'Modifiez les informations ci-dessous' : 'Remplissez tous les champs obligatoires';
  }

  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return 'Sauvegarde...';
    }
    return this.isEditMode ? 'Enregistrer' : 'Ajouter';
  }

  private checkPermissions(): void {
    if (!this.authService.canManage()) {
      this.router.navigate(['/access-denied']);
      return;
    }
  }

  private determineMode(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.isEditMode = data['mode'] === 'edit';
    });

    if (this.isEditMode) {
      this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
      if (!this.employeeId) {
        this.router.navigate(['/employees']);
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: ['', [Validators.required]],
      departmentId: ['', [Validators.required]],
      hireDate: ['', [Validators.required]],
      salary: ['', [Validators.required, Validators.min(0)]]
    });
  }

  private loadDepartments(): void {
    // TODO: Implémenter le chargement des départements depuis le service
    // En attendant, utiliser des données fictives
    this.departments = [
      { id: 1, name: 'Informatique', description: '', managerId: 1, managerName: 'Manager IT', createdAt: new Date(), employeeCount: 5 },
      { id: 2, name: 'Ressources Humaines', description: '', managerId: 2, managerName: 'Manager RH', createdAt: new Date(), employeeCount: 3 },
      { id: 3, name: 'Marketing', description: '', managerId: 3, managerName: 'Manager Marketing', createdAt: new Date(), employeeCount: 4 },
      { id: 4, name: 'Ventes', description: '', managerId: 4, managerName: 'Manager Ventes', createdAt: new Date(), employeeCount: 6 }
    ];
  }

  private loadEmployee(): void {
    if (!this.employeeId) return;

    this.isLoading = true;
    
    this.employeeService.getEmployeeById(this.employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee) => {
          this.currentEmployee = employee;
          this.patchFormWithEmployee(employee);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'employé:', error);
          this.snackBar.open('Erreur lors du chargement de l\'employé', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
          this.router.navigate(['/employees']);
        }
      });
  }

  private patchFormWithEmployee(employee: Employee): void {
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone || '', // Correction : utilise la propriété qui existe maintenant
      position: employee.position,
      departmentId: employee.departmentId,
      hireDate: new Date(employee.hireDate),
      salary: employee.salary
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    
    if (this.isEditMode) {
      this.updateEmployee();
    } else {
      this.createEmployee();
    }
  }

  private createEmployee(): void {
    const formData = this.employeeForm.value;
    
    // Extraire prénom et nom du nom complet pour la compatibilité
    const names = formData.fullName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || firstName; // Si pas de nom de famille, utiliser le prénom

    const createRequest: CreateEmployeeRequest = {
      firstName: firstName,
      lastName: lastName,
      fullName: formData.fullName.trim(), // Correction : inclure fullName
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || undefined,
      position: formData.position.trim(),
      departmentId: Number(formData.departmentId),
      hireDate: new Date(formData.hireDate),
      salary: Number(formData.salary)
    };

    this.employeeService.createEmployee(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee) => {
          this.snackBar.open('Employé créé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.isSubmitting = false;
          this.router.navigate(['/employees', employee.id]);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.snackBar.open('Erreur lors de la création de l\'employé', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
  }

  private updateEmployee(): void {
    if (!this.employeeId) return;

    const formData = this.employeeForm.value;
    
    // Extraire prénom et nom du nom complet pour la compatibilité
    const names = formData.fullName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || firstName;

    const updateRequest: UpdateEmployeeRequest = {
      firstName: firstName,
      lastName: lastName,
      fullName: formData.fullName.trim(), // Correction : inclure fullName
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || undefined,
      position: formData.position.trim(),
      departmentId: Number(formData.departmentId),
      hireDate: new Date(formData.hireDate),
      salary: Number(formData.salary)
    };

    this.employeeService.updateEmployee(this.employeeId, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee) => {
          this.snackBar.open('Employé mis à jour avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.isSubmitting = false;
          this.router.navigate(['/employees', employee.id]);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.snackBar.open('Erreur lors de la mise à jour de l\'employé', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
  }

  goBack(): void {
    if (this.employeeForm.dirty && !this.isSubmitting) {
      const confirmLeave = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?');
      if (!confirmLeave) {
        return;
      }
    }
    
    this.router.navigate(['/employees']);
  }
}