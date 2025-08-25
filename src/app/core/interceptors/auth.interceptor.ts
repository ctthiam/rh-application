
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenir le token d'authentification
  const token = authService.getToken();

  // Cloner la requête et ajouter le header Authorization si le token existe
  let authReq = req;
  if (token && !req.url.includes('/auth/login')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Passer la requête au handler suivant et gérer les erreurs
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Erreur HTTP:', error);

      // Si erreur 401 (Non autorisé), déconnecter l'utilisateur
      if (error.status === 401) {
        console.warn('Token expiré ou invalide, déconnexion...');
        authService.logout();
        return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
      }

      // Si erreur 403 (Interdit), rediriger vers une page d'erreur
      if (error.status === 403) {
        console.warn('Accès interdit pour cette ressource');
        router.navigate(['/access-denied']);
        return throwError(() => new Error('Accès refusé à cette ressource.'));
      }

      // Si erreur 404 (Non trouvé)
      if (error.status === 404) {
        console.warn('Ressource non trouvée');
        return throwError(() => new Error('La ressource demandée n\'a pas été trouvée.'));
      }

      // Si erreur 500 (Erreur serveur)
      if (error.status === 500) {
        console.error('Erreur serveur:', error);
        return throwError(() => new Error('Erreur interne du serveur. Veuillez réessayer plus tard.'));
      }

      // Si erreur réseau (0)
      if (error.status === 0) {
        console.error('Erreur réseau:', error);
        return throwError(() => new Error('Impossible de se connecter au serveur. Vérifiez votre connexion.'));
      }

      // Pour toutes les autres erreurs
      const errorMessage = error.error?.message || error.message || 'Une erreur inattendue s\'est produite.';
      return throwError(() => new Error(errorMessage));
    })
  );
};