import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, NotificationRecord } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-inbox',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './notification-inbox.component.html',
  styleUrls: ['./notification-inbox.component.css']
})
export class NotificationInboxComponent implements OnInit, OnDestroy {
  notifications: NotificationRecord[] = [];
  unreadCount: number = 0;
  loading: boolean = false;
  showingAll: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('🔔 NotificationInboxComponent initialized');
    await this.loadNotifications();
    await this.updateUnreadCount();
    
    // Subscribe to real-time notification updates
    this.notificationService.subscribeToNotificationUpdates((notification) => {
      this.notifications.unshift(notification);
      this.unreadCount++;
    });
  }

  ngOnDestroy() {
    // Cleanup handled by service
  }

  async loadNotifications() {
    this.loading = true;
    try {
      if (this.showingAll) {
        this.notifications = await this.notificationService.getAllNotifications(20);
      } else {
        this.notifications = await this.notificationService.getUnreadNotifications();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      this.loading = false;
    }
  }

  async updateUnreadCount() {
    this.unreadCount = await this.notificationService.getUnreadCount();
  }

  async markAsRead(notification: NotificationRecord) {
    if (!notification.is_read) {
      const success = await this.notificationService.markAsRead(notification.id);
      if (success) {
        notification.is_read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    }
  }

  async markAllAsRead() {
    const success = await this.notificationService.markAllAsRead();
    if (success) {
      this.notifications.forEach(n => n.is_read = true);
      this.unreadCount = 0;
      this.notificationService.notify('✅ Success', 'All notifications marked as read', 'success');
    }
  }

  async deleteNotification(notification: NotificationRecord, event: Event) {
    event.stopPropagation(); // Prevent menu from closing
    
    const success = await this.notificationService.deleteNotification(notification.id);
    if (success) {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
      if (!notification.is_read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    }
  }

  toggleView() {
    this.showingAll = !this.showingAll;
    this.loadNotifications();
  }

  getIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'success': 'check_circle',
      'error': 'error',
      'warning': 'warning',
      'info': 'info'
    };
    return iconMap[type] || 'notifications';
  }

  getIconColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'success': 'text-green-600',
      'error': 'text-red-600',
      'warning': 'text-orange-600',
      'info': 'text-blue-600'
    };
    return colorMap[type] || 'text-gray-600';
  }

  getTimeAgo(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return created.toLocaleDateString();
  }

  handleNotificationClick(notification: NotificationRecord) {
    // Mark as read when clicked
    this.markAsRead(notification);

    // Handle navigation based on notification data
    if (notification.data && notification.data.route) {
      this.router.navigate([notification.data.route]);
    }
  }

  async refresh() {
    await this.loadNotifications();
    await this.updateUnreadCount();
    this.notificationService.notify('🔄 Refreshed', 'Notifications updated', 'info');
  }
}
