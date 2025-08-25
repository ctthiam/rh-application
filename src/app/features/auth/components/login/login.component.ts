import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { LoginRequest, UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  returnUrl: string = '/dashboard';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour si elle existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Si l'utilisateur est déjà connecté, le rediriger (une seule fois)
    const currentUser = this.authService.getCurrentUser();
    if (this.authService.isLoggedIn() && currentUser) {
      console.log('Utilisateur déjà connecté, redirection...');
      this.redirectAfterLogin();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      login: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.performLogin();
    } else {
      this.markFormGroupTouched();
    }
  }

  private performLogin(): void {
    this.isLoading = true;
    this.loadingService.show();

    const loginRequest: LoginRequest = {
      login: this.loginForm.get('login')?.value.trim(),
      password: this.loginForm.get('password')?.value
    };

    console.log('Tentative de connexion pour:', loginRequest.login);

    this.authService.login(loginRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Connexion réussie:', response);
          this.showSuccessMessage(`Bienvenue, ${response.fullName}!`);
          
          // Attendre un court délai pour que l'état soit mis à jour
          setTimeout(() => {
            this.redirectAfterLogin();
          }, 100);
        },
        error: (error) => {
          console.error('Erreur de connexion:', error);
          this.handleLoginError(error);
          this.isLoading = false;
          this.loadingService.hide();
        },
        complete: () => {
          console.log('Processus de connexion terminé');
        }
      });
  }

  // Remplacez la méthode redirectAfterLogin dans login.component.ts

// Dans login.component.ts - Méthode redirectAfterLogin corrigée

private redirectAfterLogin(): void {
  const currentUser = this.authService.getCurrentUser();
  if (!currentUser) {
    console.error('Aucun utilisateur trouvé après connexion');
    this.isLoading = false;
    this.loadingService.hide();
    return;
  }

  console.log('Redirection pour utilisateur:', currentUser.login, 'Rôle:', currentUser.role);

  // Arrêter le loading avant la redirection
  this.isLoading = false;
  this.loadingService.hide();

  // CORRECTION : Utiliser simplement '/dashboard' 
  // Le DashboardComponent se chargera de rediriger selon le rôle
  if (this.returnUrl === '/dashboard' || this.returnUrl === '/') {
    console.log('Redirection vers dashboard - sera redirigé selon le rôle');
    this.router.navigate(['/dashboard'], { replaceUrl: true });
  } else {
    console.log('Redirection vers URL de retour:', this.returnUrl);
    this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
  }
}

  private handleLoginError(error: any): void {
    let errorMessage = 'Une erreur est survenue lors de la connexion.';

    if (error.status === 401) {
      errorMessage = 'Login ou mot de passe incorrect.';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showErrorMessage(errorMessage);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Getters pour les erreurs de validation
  get loginError(): string | null {
    const control = this.loginForm.get('login');
    if (control?.hasError('required') && control?.touched) {
      return 'Le login est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le login doit contenir au moins 3 caractères';
    }
    return null;
  }

  get passwordError(): string | null {
    const control = this.loginForm.get('password');
    if (control?.hasError('required') && control?.touched) {
      return 'Le mot de passe est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return null;
  }
}