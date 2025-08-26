// src/app/features/departments/departments.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DepartmentsComponent } from './departments.component';
import { DepartmentFormComponent } from './components/department-form/department-form.component';
import { DepartmentDetailsComponent } from './components/department-details/department-details.component';

const routes = [
  {
    path: '',
    component: DepartmentsComponent
  },
  {
    path: 'create',
    component: DepartmentFormComponent,
    data: { mode: 'create' }
  },
  {
    path: ':id',
    component: DepartmentDetailsComponent
  },
  {
    path: ':id/edit',
    component: DepartmentFormComponent,
    data: { mode: 'edit' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [],
  exports: [RouterModule]
})
export class DepartmentsModule {}