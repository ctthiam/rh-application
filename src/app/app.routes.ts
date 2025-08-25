// 2. src/app/app.routes.ts (version corrigée pour les composants standalone)
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  // Redirection par défaut
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full' as const
  },

  // Routes d'authentification (publiques)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },

  // Routes protégées par authentification
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },

  // // Routes pour les employés (tous les utilisateurs connectés) - Version standalone
  // {
  //   path: 'employees',
  //   canActivate: [AuthGuard],
  //   loadComponent: () => import('./features/employees/employees.component').then(c => c.EmployeesComponent)
  // },

  // // Routes pour les tâches (tous les utilisateurs connectés) - Version standalone
  // {
  //   path: 'tasks',
  //   canActivate: [AuthGuard],
  //   loadComponent: () => import('./features/tasks/tasks.component').then(c => c.TasksComponent)
  // },

  // // Routes pour les départements (ADMIN et MANAGER uniquement) - Version standalone
  // {
  //   path: 'departments',
  //   canActivate: [AuthGuard, RoleGuard],
  //   data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  //   loadComponent: () => import('./features/departments/departments.component').then(c => c.DepartmentsComponent)
  // },

  // Routes d'administration (ADMIN uniquement) - Version standalone
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    loadComponent: () => import('./features/dashboard/components/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent)
  },

  // // Route de profil utilisateur - Version standalone
  // {
  //   path: 'profile',
  //   canActivate: [AuthGuard],
  //   loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent)
  // },

  // Page d'erreur 404
  {
    path: 'not-found',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
  },

  // Page d'accès refusé
  {
    path: 'access-denied',
    loadComponent: () => import('./shared/components/access-denied/access-denied.component').then(c => c.AccessDeniedComponent)
  },

  // Toutes les autres routes redirigent vers 404
  {
    path: '**',
    redirectTo: '/not-found'
  }
];