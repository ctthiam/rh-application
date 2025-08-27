import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // AJOUTÉ pour ngModel

import { DashboardChartsComponent } from './components/dashboard-charts/dashboard-charts.component';
import { RecentTasksComponent } from './components/recent-tasks/recent-tasks.component';

// Import du routing module
import { DashboardRoutingModule } from './dashboard-routing.module';

// Angular Material Modules - MODULES MANQUANTS AJOUTÉS
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';

// MODULES MANQUANTS AJOUTÉS POUR RÉSOUDRE LES ERREURS
import { MatMenuModule } from '@angular/material/menu'; // Pour mat-menu et matMenuTriggerFor
import { MatCheckboxModule } from '@angular/material/checkbox'; // Pour mat-checkbox

// Components
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard/employee-dashboard.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

@NgModule({
  declarations: [
    ManagerDashboardComponent,
    EmployeeDashboardComponent,
    NotificationsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule, // AJOUTÉ - Nécessaire pour ngModel
    DashboardChartsComponent,
    // IMPORTANT: Ajouter le routing module ici
    DashboardRoutingModule,
    AdminDashboardComponent,
    RecentTasksComponent,
    
    // Angular Material - MODULES CORRIGÉS ET COMPLÉTÉS
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatTableModule,
    
    // NOUVEAUX MODULES AJOUTÉS
    MatMenuModule, // Pour résoudre les erreurs mat-menu
    MatCheckboxModule, // Pour résoudre les erreurs mat-checkbox
  ]
})
export class DashboardModule { }