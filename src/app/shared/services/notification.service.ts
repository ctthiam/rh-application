// src/app/shared/services/notification.service.ts

import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotificationOptions {
  duration?: number;
  action?: string;
  panelClass?: string | string[];
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  private defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Afficher une notification de succès
   */
  showSuccess(message: string, options?: NotificationOptions): void {
    const config = this.mergeConfig(options, ['success-snackbar']);
    this.snackBar.open(message, options?.action || 'Fermer', config);
  }

  /**
   * Afficher une notification d'erreur
   */
  showError(message: string, options?: NotificationOptions): void {
    const config = this.mergeConfig(options, ['error-snackbar']);
    config.duration = options?.duration || 6000; // Plus long pour les erreurs
    this.snackBar.open(message, options?.action || 'Fermer', config);
  }

  /**
   * Afficher une notification d'information
   */
  showInfo(message: string, options?: NotificationOptions): void {
    const config = this.mergeConfig(options, ['info-snackbar']);
    this.snackBar.open(message, options?.action || 'Fermer', config);
  }

  /**
   * Afficher une notification d'avertissement
   */
  showWarning(message: string, options?: NotificationOptions): void {
    const config = this.mergeConfig(options, ['warning-snackbar']);
    this.snackBar.open(message, options?.action || 'Fermer', config);
  }

  /**
   * Afficher une notification personnalisée
   */
  show(message: string, action?: string, options?: NotificationOptions): void {
    const config = this.mergeConfig(options);
    this.snackBar.open(message, action || 'Fermer', config);
  }

  /**
   * Fermer toutes les notifications ouvertes
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }

  /**
   * Fusionner la configuration par défaut avec les options personnalisées
   */
  private mergeConfig(options?: NotificationOptions, additionalClasses?: string[]): MatSnackBarConfig {
    const config: MatSnackBarConfig = { ...this.defaultConfig };

    if (options) {
      if (options.duration !== undefined) config.duration = options.duration;
      if (options.horizontalPosition) config.horizontalPosition = options.horizontalPosition;
      if (options.verticalPosition) config.verticalPosition = options.verticalPosition;
      
      // Gérer les classes CSS
      let panelClass: string[] = [];
      if (options.panelClass) {
        panelClass = Array.isArray(options.panelClass) ? options.panelClass : [options.panelClass];
      }
      if (additionalClasses) {
        panelClass = [...panelClass, ...additionalClasses];
      }
      if (panelClass.length > 0) {
        config.panelClass = panelClass;
      }
    } else if (additionalClasses) {
      config.panelClass = additionalClasses;
    }

    return config;
  }
}