import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter } from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';
import { LoadingService } from './shared/services/loading.service';
import { UserRole } from './core/models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="app-container">
      <!-- Spinner de chargement global -->
      <div *ngIf="loadingService.loading$ | async" class="global-loading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement...</p>
      </div>

      <!-- Contenu principal -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      overflow: hidden;
    }

    .global-loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .global-loading p {
      margin-top: 16px;
      font-size: 14px;
      color: #666;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Application RH';

  constructor(
    private authService: AuthService,
    private router: Router,
    public loadingService: LoadingService
  ) {
  this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      console.log('Navigation vers:', event.url);
    }
  });
}

  ngOnInit(): void {
    // Écouter les changements de route pour des actions spécifiques
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        // Log de navigation pour le debug
        console.log('Navigation vers:', event.urlAfterRedirects);
        
        // Vérifier l'état d'authentification uniquement pour certaines routes
        this.checkAuthenticationState(event.urlAfterRedirects);
      });

    // Vérification initiale de l'authentification
    this.checkAuthenticationState(this.router.url);
  }

  private checkAuthenticationState(currentRoute: string): void {
    const currentUser = this.authService.getCurrentUser();
    const isLoggedIn = this.authService.isLoggedIn();

    console.log('État d\'authentification:', {
      isLoggedIn,
      currentUser: currentUser?.login,
      currentRoute
    });

    // Rediriger vers le dashboard approprié si l'utilisateur est connecté et sur la page de login
    // IMPORTANT: Éviter la redirection si on est déjà en train de naviguer vers un dashboard
    if (isLoggedIn && currentUser && 
        currentRoute.includes('/auth/login') && 
        !currentRoute.includes('/dashboard')) {
      
      console.log('Redirection depuis app.component vers dashboard...');
      this.redirectToDashboard(currentUser.role);
    }
  }

  private redirectToDashboard(role: UserRole): void {
    console.log('Redirection vers dashboard pour le rôle:', role);
    
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/dashboard/admin'], { replaceUrl: true });
        break;
      case UserRole.MANAGER:
        this.router.navigate(['/dashboard/manager'], { replaceUrl: true });
        break;
      case UserRole.EMPLOYE:
        this.router.navigate(['/dashboard/employee'], { replaceUrl: true });
        break;
      default:
        this.router.navigate(['/dashboard'], { replaceUrl: true });
        break;
    }
  }
}