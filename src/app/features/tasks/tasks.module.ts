// src/app/features/tasks/tasks.module.ts
import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatProgressBarModule } from '@angular/material/progress-bar';

// Material Design imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

// Components
import { TasksComponent } from './tasks.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskDetailsComponent } from './components/task-details/task-details.component';
import { MyTasksComponent } from './components/my-tasks/my-tasks.component';

// Guards
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/models/user.model';

// Shared module
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: TasksComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: TasksComponent },
      { path: 'my-tasks', component: MyTasksComponent },
      { 
        path: 'create', 
        component: TaskFormComponent,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.MANAGER], mode: 'create' }
      },
      { 
        path: ':id/edit', 
        component: TaskFormComponent,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.MANAGER], mode: 'edit' }
      },
      { path: ':id', component: TaskDetailsComponent }
    ]
  }
];

@NgModule({
  declarations: [
    // Déclarez vos composants ici au lieu de les importer
    TasksComponent,
    TaskFormComponent,
    TaskDetailsComponent,
    MyTasksComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    
    // Material Design Modules
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule, // AJOUTÉ
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatDividerModule
  ],
  providers: [
    DatePipe // Ajout du DatePipe pour le template
  ],
  exports: [
    TasksComponent,
    TaskFormComponent,
    TaskDetailsComponent,
    MyTasksComponent
  ]
})
export class TasksModule { }