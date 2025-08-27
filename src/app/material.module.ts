import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// MODULES AJOUTÉS POUR RÉSOUDRE LES ERREURS
import { MatMenuModule } from '@angular/material/menu'; // Pour mat-menu et matMenuTriggerFor
import { MatCheckboxModule } from '@angular/material/checkbox'; // Pour mat-checkbox
import { MatTooltipModule } from '@angular/material/tooltip'; // Pour matTooltip
import { MatChipsModule } from '@angular/material/chips'; // Pour mat-chip-set

@NgModule({
  exports: [
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSelectModule,
    MatProgressBarModule,
    
    // NOUVEAUX EXPORTS AJOUTÉS
    MatMenuModule, // Pour résoudre les erreurs mat-menu
    MatCheckboxModule, // Pour résoudre les erreurs mat-checkbox
    MatTooltipModule, // Pour matTooltip
    MatChipsModule, // Pour mat-chip-set
  ]
})
export class MaterialModule { }