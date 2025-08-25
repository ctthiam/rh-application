import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCount = 0;

  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  /**
   * Afficher le spinner de chargement
   */
  show(): void {
    this.loadingCount++;
    if (this.loadingCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Masquer le spinner de chargement
   */
  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Forcer l'arrêt du chargement
   */
  forceHide(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Obtenir l'état actuel du chargement
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}