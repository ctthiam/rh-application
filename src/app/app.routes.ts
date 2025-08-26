// src/app/app.routes.ts (mise à jour complète avec gestion des tâches)
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

  // Routes pour les employés (ADMIN et MANAGER)
  {
    path: 'employees',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    children: [
      {
        path: '',
        loadComponent: () => import('./features/employees/employees.component').then(c => c.EmployeesComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/employees/components/employee-form/employee-form.component').then(c => c.EmployeeFormComponent),
        data: { mode: 'create' }
      },
      {
        path: ':id',
        loadComponent: () => import('./features/employees/components/employee-details/employee-details.component').then(c => c.EmployeeDetailsComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/employees/components/employee-form/employee-form.component').then(c => c.EmployeeFormComponent),
        data: { mode: 'edit' }
      }
    ]
  },

  // Routes pour les départements (ADMIN et MANAGER lecture seule)
  {
    path: 'departments',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    loadChildren: () => import('./features/departments/departments.module').then(m => m.DepartmentsModule)
  },

  // Routes pour les tâches (tous les utilisateurs connectés)
  {
    path: 'tasks',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/tasks/tasks.module').then(m => m.TasksModule)
  },

  // Routes d'administration (ADMIN uniquement)
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/components/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent)
      },
      // {
      //   path: 'users',
      //   loadComponent: () => import('./features/users/users.component').then(c => c.UsersComponent)
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () => import('./features/admin/settings/settings.component').then(c => c.SettingsComponent)
      // }
    ]
  },

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