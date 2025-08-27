import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { DashboardNotification } from '../../services/dashboard.service';

// Interface pour les paramètres de notification
export interface NotificationSettings {
  showTaskReminders: boolean;
  showDeadlineAlerts: boolean;
  showTeamUpdates: boolean;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() notifications: DashboardNotification[] = [];
  @Input() loading: boolean = false;
  @Output() notificationClick = new EventEmitter<DashboardNotification>();
  @Output() markAsRead = new EventEmitter<string>();
  @Output() clearAll = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  showAll = false;

  // Propriétés ajoutées pour résoudre les erreurs
  settings: NotificationSettings = {
    showTaskReminders: true,
    showDeadlineAlerts: true,
    showTeamUpdates: true
  };

  // Nouvelles notifications pour les toasts
  newNotifications: DashboardNotification[] = [];

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get displayedNotifications(): DashboardNotification[] {
    if (this.showAll) {
      return this.notifications;
    }
    return this.notifications.slice(0, 5);
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  onNotificationClick(notification: DashboardNotification): void {
    if (!notification.read) {
      this.markAsRead.emit(notification.id);
    }
    this.notificationClick.emit(notification);
  }

  onMarkAsRead(event: Event, notificationId: string): void {
    event.stopPropagation();
    this.markAsRead.emit(notificationId);
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  // Méthodes ajoutées pour résoudre les erreurs du template
  onActionClick(event: Event, notification: DashboardNotification): void {
    event.stopPropagation();
    if (notification.actionUrl) {
      // Logique pour naviguer vers l'URL d'action
      window.open(notification.actionUrl, '_blank');
    }
    this.notificationClick.emit(notification);
  }

  onDismiss(event: Event, notificationId: string): void {
    event.stopPropagation();
    // Supprimer la notification de la liste locale
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    // Optionnel : émettre un événement pour notifier le parent
    this.markAsRead.emit(notificationId);
  }

  dismissToast(toastId: string): void {
    this.newNotifications = this.newNotifications.filter(n => n.id !== toastId);
  }

  // Méthode pour ajouter une nouvelle notification toast
  addNewNotification(notification: DashboardNotification): void {
    this.newNotifications.push(notification);
    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      this.dismissToast(notification.id);
    }, 5000);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'check_circle';
      default: return 'notifications';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'info': return 'notification-info';
      case 'warning': return 'notification-warning';
      case 'error': return 'notification-error';
      case 'success': return 'notification-success';
      default: return 'notification-default';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return 'maintenant';
  }

  getNotificationClasses(notification: any) {
    const classes: any = {
      'notification-unread': !notification.read
    };
    classes[this.getNotificationColor(notification.type)] = true;
    return classes;
  }

  trackByNotificationId(index: number, notification: any): string {
    return notification.id || index.toString();
  }
}