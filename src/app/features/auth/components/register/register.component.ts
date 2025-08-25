// src/app/features/auth/components/register/register.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { CreateUserRequest, UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  
  userRoles = [
    { value: UserRole.EMPLOYE, label: 'Employé' },
    { value: UserRole.MANAGER, label: 'Manager' },
    { value: UserRole.ADMIN, label: 'Administrateur' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.registerForm = this.createRegisterForm();
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    this.authService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.router.navigate(['/dashboard']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createRegisterForm(): FormGroup {
    return this.fb.group({
      login: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_.-]+$/)
      ]],
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100)
      ]],
      confirmPassword: ['', [Validators.required]],
      role: [UserRole.EMPLOYE, [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.performRegistration();
    } else {
      this.markFormGroupTouched();
    }
  }

  private performRegistration(): void {
    this.isLoading = true;
    this.loadingService.show();

    const registerRequest: CreateUserRequest = {
      login: this.registerForm.get('login')?.value.trim(),
      fullName: this.registerForm.get('fullName')?.value.trim(),
      email: this.registerForm.get('email')?.value.trim().toLowerCase(),
      password: this.registerForm.get('password')?.value,
      role: this.registerForm.get('role')?.value
    };

    this.userService.createUser(registerRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Inscription réussie:', response);
          this.showSuccessMessage('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error('Erreur d\'inscription:', error);
          this.handleRegistrationError(error);
        },
        complete: () => {
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
  }

  private handleRegistrationError(error: any): void {
    let errorMessage = 'Une erreur est survenue lors de l\'inscription.';

    if (error.status === 400) {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        // Gestion des erreurs de validation
        const errors = Object.values(error.error.errors).flat();
        errorMessage = errors.join(', ');
      }
    } else if (error.status === 409) {
      errorMessage = 'Ce login ou cette adresse email existe déjà.';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur.';
    }

    this.showErrorMessage(errorMessage);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // Getters pour les erreurs de validation
  get loginError(): string | null {
    const control = this.registerForm.get('login');
    if (control?.hasError('required') && control?.touched) {
      return 'Le login est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le login doit contenir au moins 3 caractères';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Le login ne peut pas dépasser 50 caractères';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'Le login ne peut contenir que des lettres, chiffres, points, tirets et underscores';
    }
    return null;
  }

  get fullNameError(): string | null {
    const control = this.registerForm.get('fullName');
    if (control?.hasError('required') && control?.touched) {
      return 'Le nom complet est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le nom doit contenir au moins 2 caractères';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Le nom ne peut pas dépasser 100 caractères';
    }
    return null;
  }

  get emailError(): string | null {
    const control = this.registerForm.get('email');
    if (control?.hasError('required') && control?.touched) {
      return 'L\'adresse email est requise';
    }
    if (control?.hasError('email') && control?.touched) {
      return 'Veuillez entrer une adresse email valide';
    }
    return null;
  }

  get passwordError(): string | null {
    const control = this.registerForm.get('password');
    if (control?.hasError('required') && control?.touched) {
      return 'Le mot de passe est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Le mot de passe ne peut pas dépasser 100 caractères';
    }
    return null;
  }

  get confirmPasswordError(): string | null {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required') && control?.touched) {
      return 'La confirmation du mot de passe est requise';
    }
    if (control?.hasError('passwordMismatch') && control?.touched) {
      return 'Les mots de passe ne correspondent pas';
    }
    return null;
  }

  get roleError(): string | null {
    const control = this.registerForm.get('role');
    if (control?.hasError('required') && control?.touched) {
      return 'Le rôle est requis';
    }
    return null;
  }
}