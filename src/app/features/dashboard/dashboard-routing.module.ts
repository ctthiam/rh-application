// src/app/features/dashboard/dashboard-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/models/user.model';

// Import des composants (créez-les s'ils n'existent pas encore)
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard/employee-dashboard.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'employee', // Redirection par défaut vers employee
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