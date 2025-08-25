// src/app/layouts/main-layout/main-layout.component.ts

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil, filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../shared/services/loading.service';
import { User, UserRole } from '../../core/models/user.model';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  children?: NavigationItem[];
}

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;

  currentUser: User | null = null;
  isHandset = false;
  isLoading = false;
  currentRoute = '';

  private destroy$ = new Subject<void>();

  // Menu de navigation selon les rôles
  navigationItems: NavigationItem[] = [
    {
      label: 'Tableau de bord',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Employés',
      icon: 'people',
      route: '/employees',
      children: [
        { label: 'Liste des employés', icon: 'list', route: '/employees' },
        { label: 'Ajouter un employé', icon: 'person_add', route: '/employees/create', roles: [UserRole.ADMIN, UserRole.MANAGER] }
      ]
    },
    {
      label: 'Tâches',
      icon: 'assignment',
      route: '/tasks',
      children: [
        { label: 'Mes tâches', icon: 'assignment_ind', route: '/tasks/my-tasks' },
        { label: 'Toutes les tâches', icon: 'assignment', route: '/tasks', roles: [UserRole.ADMIN, UserRole.MANAGER] },
        { label: 'Créer une tâche', icon: 'add_task', route: '/tasks/create', roles: [UserRole.ADMIN, UserRole.MANAGER] }
      ]
    },
    {
      label: 'Départements',
      icon: 'domain',
      route: '/departments',
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      children: [
        { label: 'Liste des départements', icon: 'list', route: '/departments' },
        { label: 'Ajouter un département', icon: 'add', route: '/departments/create', roles: [UserRole.ADMIN] }
      ]
    },
    {
      label: 'Administration',
      icon: 'admin_panel_settings',
      route: '/admin',
      roles: [UserRole.ADMIN],
      children: [
        { label: 'Gestion des utilisateurs', icon: 'manage_accounts', route: '/admin/users' },
        { label: 'Paramètres système', icon: 'settings', route: '/admin/settings' },
        { label: 'Logs', icon: 'description', route: '/admin/logs' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.initializeLayout();
    this.setupResponsiveLayout();
    this.monitorRouteChanges();
    this.monitorLoadingState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeLayout(): void {
    // Écouter les changements d'utilisateur connecté
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        console.log('Utilisateur connecté dans layout:', user);
      });
  }

  private setupResponsiveLayout(): void {
    // Détecter les petits écrans
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isHandset = result.matches;
      });
  }

  private monitorRouteChanges(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        
        // Fermer le drawer sur mobile après navigation
        if (this.isHandset && this.drawer) {
          this.drawer.close();
        }
      });
  }

  private monitorLoadingState(): void {
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  /**
   * Vérifier si un élément de navigation doit être affiché selon le rôle
   */
  canShowNavItem(item: NavigationItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true; // Accessible à tous si pas de rôles spécifiés
    }

    if (!this.currentUser) {
      return false;
    }

    return item.roles.includes(this.currentUser.role);
  }

  /**
   * Vérifier si la route actuelle correspond à l'élément de navigation
   */
  isActiveRoute(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  /**
   * Naviguer vers une route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Se déconnecter
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Aller au profil utilisateur
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Obtenir le nom d'affichage du rôle
   */
  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    return this.authService.getRoleDisplayName(this.currentUser.role);
  }

  /**
   * Obtenir la couleur du rôle pour l'affichage
   */
  getRoleColor(): string {
    if (!this.currentUser) return 'primary';
    
    switch (this.currentUser.role) {
      case UserRole.ADMIN:
        return 'warn';
      case UserRole.MANAGER:
        return 'accent';
      case UserRole.EMPLOYE:
        return 'primary';
      default:
        return 'primary';
    }
  }

  /**
   * Basculer l'état du drawer
   */
  toggleDrawer(): void {
    if (this.drawer) {
      this.drawer.toggle();
    }
  }
}