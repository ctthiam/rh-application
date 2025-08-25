// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

// NOTE: NavbarComponent est maintenant standalone, il n'est plus déclaré ici

@NgModule({
  declarations: [
    // NavbarComponent retiré car maintenant standalone
    // Autres composants non-standalone ici
  ],
  imports: [
    CommonModule,
    RouterModule,
    
    // Material
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule
  ],
  exports: [
    // NavbarComponent retiré car maintenant standalone
    
    // Réexporter les modules Material pour les autres composants
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule
  ]
})
export class SharedModule { }