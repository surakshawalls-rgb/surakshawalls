import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  // Swipe tracking
  swipeStartX: number = 0;
  swipeCurrentX: number = 0;
  swipingNotificationId: string | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    console.log('🔔 NotificationInboxComponent initialized');
    
    // Wait for notification service to be ready (user loaded)
    await this.waitForServiceReady();
    
    await this.loadNotifications();
    await this.updateUnreadCount();
    
    // Subscribe to real-time notification updates
    this.notificationService.subscribeToNotificationUpdates((notification) => {
      console.log('📬 New notification in inbox:', notification);
      this.notifications.unshift(notification);
      this.unreadCount++;
      // Trigger change detection to update UI
      this.cdr.detectChanges();
    });
  }

  private async waitForServiceReady() {
    // Wait up to 5 seconds for user to be loaded
    let attempts = 0;
    while (attempts < 50) {
      const count = await this.notificationService.getUnreadCount();
      if (count !== undefined) {
        console.log('✅ Notification service ready');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    console.warn('⚠️ Notification service took too long to initialize');
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

  // Check if notification is from today
  isToday(createdAt: string): boolean {
    const notificationDate = new Date(createdAt);
    const today = new Date();
    return notificationDate.toDateString() === today.toDateString();
  }

  // Swipe handlers
  onTouchStart(event: TouchEvent, notificationId: string) {
    this.swipeStartX = event.touches[0].clientX;
    this.swipingNotificationId = notificationId;
  }

  onTouchMove(event: TouchEvent, notificationId: string) {
    if (this.swipingNotificationId !== notificationId) return;
    
    this.swipeCurrentX = event.touches[0].clientX;
    const deltaX = this.swipeCurrentX - this.swipeStartX;
    
    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      const element = event.currentTarget as HTMLElement;
      element.style.transform = `translateX(${deltaX}px)`;
      
      // Show red background when swiping
      if (Math.abs(deltaX) > 50) {
        element.style.backgroundColor = '#fee2e2';
      }
    }
  }

  onTouchEnd(event: TouchEvent, notification: NotificationRecord) {
    const deltaX = this.swipeCurrentX - this.swipeStartX;
    const element = event.currentTarget as HTMLElement;
    
    // If swiped left more than 100px, delete
    if (deltaX < -100) {
      // Check if it's today's notification
      if (this.isToday(notification.created_at)) {
        this.notificationService.notify('Protected', "Cannot delete today's notifications", 'warning');
        // Reset animation
        element.style.transform = '';
        element.style.backgroundColor = '';
      } else {
        // Animate out and delete
        element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        element.style.transform = 'translateX(-100%)';
        element.style.opacity = '0';
        
        setTimeout(() => {
          this.deleteNotificationById(notification);
        }, 300);
      }
    } else {
      // Reset if not swiped enough
      element.style.transition = 'transform 0.3s ease, background-color 0.3s ease';
      element.style.transform = '';
      element.style.backgroundColor = '';
    }
    
    this.swipingNotificationId = null;
    this.swipeStartX = 0;
    this.swipeCurrentX = 0;
  }

  async deleteNotificationById(notification: NotificationRecord) {
    const success = await this.notificationService.deleteNotification(notification.id);
    if (success) {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
      if (!notification.is_read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.cdr.detectChanges();
    }
  }

  getSwipeTransform(notificationId: string): string {
    return this.swipingNotificationId === notificationId ? 'swiping' : '';
  }
}
