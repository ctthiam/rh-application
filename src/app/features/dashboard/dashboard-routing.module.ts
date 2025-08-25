// src/app/features/dashboard/dashboard-routing.module.ts - Version corrigée
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/models/user.model';

// Import des composants
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard/employee-dashboard.component';
import { DashboardComponent } from './components/dashboard/dashboard.component'; // Composant de redirection

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent, // Composant qui redirige selon le rôle
    pathMatch: 'full'
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.ADMIN] }
  },
  {
    path: 'manager',
    component: ManagerDashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] }
  },
  {
    path: 'employee',
    component: EmployeeDashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYE] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }