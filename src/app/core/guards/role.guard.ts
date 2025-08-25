import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    const requiredRoles = route.data['roles'] as UserRole[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return this.authService.isLoggedIn$.pipe(take(1));
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const hasRequiredRole = requiredRoles.includes(user.role);
        
        if (!hasRequiredRole) {
          // Rediriger vers le dashboard approprié selon le rôle
          this.redirectBasedOnRole(user.role);
          return false;
        }

        return true;
      })
    );
  }

  private redirectBasedOnRole(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/dashboard/admin']);
        break;
      case UserRole.MANAGER:
        this.router.navigate(['/dashboard/manager']);
        break;
      case UserRole.EMPLOYE:
        this.router.navigate(['/dashboard/employee']);
        break;
      default:
        this.router.navigate(['/auth/login']);
        break;
    }
  }
}