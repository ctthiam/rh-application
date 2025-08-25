import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Imports Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.redirectToDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private redirectToDashboard(): void {
    this.loadingService.show();

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user) {
            this.navigateBasedOnRole(user.role);
          } else {
            console.warn('Aucun utilisateur connecté, redirection vers login');
            this.router.navigate(['/auth/login']);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error);
          this.router.navigate(['/auth/login']);
        },
        complete: () => {
          this.loadingService.hide();
        }
      });
  }

  private navigateBasedOnRole(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/dashboard/admin']);
        break;
      case UserRole.MANAGER:
        this.router.navigate(['/dashboard/manager']);
        break;
      case UserRole.EMPLOYE:
        this.router.navigate(['/dashboard/employee']);
        break;
      default:
        console.warn('Rôle inconnu:', role);
        this.router.navigate(['/auth/login']);
        break;
    }
  }
}