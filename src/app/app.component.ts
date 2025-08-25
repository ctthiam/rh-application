import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter } from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';
import { LoadingService } from './shared/services/loading.service';
import { UserRole } from './core/models/user.model';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatProgressSpinnerModule,
    NavbarComponent // Ajout du composant navbar
  ],
  template: `
    <div class="app-container">
      <!-- Navbar affichée seulement si utilisateur connecté et pas sur page d'auth -->
      <app-navbar *ngIf="showNavbar"></app-navbar>
      
      <!-- Spinner de chargement global -->
      <div *ngIf="loadingService.loading$ | async" class="global-loading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement...</p>
      </div>

      <!-- Contenu principal -->
      <main [class.with-navbar]="showNavbar">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    main {
      flex: 1;
      overflow: auto;
      
      &.with-navbar {
        padding-top: 0; // La navbar est sticky donc pas besoin de padding
      }
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
  showNavbar = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public loadingService: LoadingService
  ) {
    // Écouter les événements de navigation pour le debug
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        console.log('Navigation vers:', event.url);
      }
    });
  }

  ngOnInit(): void {
    // Écouter les changements de route pour gérer l'affichage de la navbar
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        console.log('Navigation vers:', event.urlAfterRedirects);
        
        // Mettre à jour la visibilité de la navbar
        this.updateNavbarVisibility(event.urlAfterRedirects);
        
        // Vérifier l'état d'authentification
        this.checkAuthenticationState(event.urlAfterRedirects);
      });

    // Écouter les changements d'état de connexion
    this.authService.isLoggedIn$.subscribe(() => {
      this.updateNavbarVisibility();
    });

    // Vérification initiale
    this.checkAuthenticationState(this.router.url);
    this.updateNavbarVisibility();
  }

  private updateNavbarVisibility(currentUrl?: string): void {
    const url = currentUrl || this.router.url;
    const isLoggedIn = this.authService.isLoggedIn();
    const isAuthPage = url.startsWith('/auth');
    
    // Afficher la navbar seulement si l'utilisateur est connecté ET n'est pas sur une page d'auth
    this.showNavbar = isLoggedIn && !isAuthPage;
    
    console.log('Navbar visibility:', {
      showNavbar: this.showNavbar,
      isLoggedIn,
      isAuthPage,
      currentUrl: url
    });
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