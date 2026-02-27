import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ToastrService } from 'ngx-toastr';

interface DatabasePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  table: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private supabase!: SupabaseClient;
  private channels: RealtimeChannel[] = [];
  private currentUserId: string | null = null;

  constructor(private toastr: ToastrService) {
    console.log('🔔 NotificationService constructor started');
    
    try {
      this.supabase = createClient(
        'https://lcwjtwidxihclizliksd.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjd2p0d2lkeGloY2xpemxpa3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTgzMzYsImV4cCI6MjA4NTI3NDMzNn0.5U5hX3UKBVg41XiBc3pUZAqL7Png8aMBzBx-OLp7PrU'
      );
      
      // Get current user
      this.getCurrentUser();
      console.log('✅ NotificationService initialized');
    } catch (error) {
      console.error('❌ Error in NotificationService constructor:', error);
    }
  }

  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUserId = user?.id || null;
  }

  // Start listening to all important tables
  startListening() {
    console.log('🔔 Starting database change notifications...');

    // ========== MANUFACTURING/CONSTRUCTION TABLES ==========
    
    // Listen to wage entries (INSERT, UPDATE, DELETE)
    this.subscribeToTable('wage_entries', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        this.showNotification('💰 New Wage Entry', `₹${data.paid_today} paid to worker`, 'info');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Wage Entry Updated', `Wage entry modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Wage Entry Deleted', `Wage entry removed`, 'warning');
      }
    });

    // Listen to firm cash ledger (INSERT, UPDATE, DELETE)
    this.subscribeToTable('firm_cash_ledger', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        if (data.type === 'receipt') {
          const categoryName = this.getCategoryName(data.category);
          this.showNotification('💵 Income Received', `₹${data.amount.toLocaleString('en-IN')} - ${categoryName}`, 'success');
        } else {
          const categoryName = this.getCategoryName(data.category);
          this.showNotification('💸 Expense Recorded', `₹${data.amount.toLocaleString('en-IN')} - ${categoryName}`, 'warning');
        }
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Cash Entry Updated', `₹${data.amount.toLocaleString('en-IN')} entry modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Cash Entry Deleted', `₹${data.amount.toLocaleString('en-IN')} entry removed`, 'warning');
      }
    });

    // Listen to material purchases (INSERT, UPDATE, DELETE)
    this.subscribeToTable('raw_materials_purchase', (payload) => {
      const data = payload.new || payload.old as any;
      const totalAmount = (data.quantity * data.unit_cost).toLocaleString('en-IN');
      if (payload.eventType === 'INSERT') {
        this.showNotification('🛒 Material Purchase', `${data.material_name} - ₹${totalAmount}`, 'success');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Purchase Updated', `${data.material_name} - ₹${totalAmount}`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Purchase Deleted', `${data.material_name} removed`, 'warning');
      }
    });

    // Listen to sales transactions (INSERT, UPDATE, DELETE)
    this.subscribeToTable('sales_transactions', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT' && data.paid_amount > 0) {
        this.showNotification('💰 Client Payment', `₹${data.paid_amount.toLocaleString('en-IN')} received`, 'success');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Transaction Updated', `Sale transaction modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Transaction Deleted', `Sale transaction removed`, 'warning');
      }
    });

    // Listen to partner master (INSERT, UPDATE, DELETE)
    this.subscribeToTable('partner_master', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        this.showNotification('🤝 New Partner', `${data.name} added as partner`, 'success');
      } else if (payload.eventType === 'UPDATE') {
        const oldData = payload.old as any;
        const newData = payload.new as any;
        if (oldData.contribution !== newData.contribution) {
          const diff = newData.contribution - oldData.contribution;
          if (diff > 0) {
            this.showNotification('🤝 Partner Contribution', `${newData.name} contributed ₹${diff.toLocaleString('en-IN')}`, 'info');
          }
        } else {
          this.showNotification('✏️ Partner Updated', `${data.name} details modified`, 'info');
        }
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Partner Removed', `${data.name} removed`, 'warning');
      }
    });

    // Listen to client ledger (INSERT, UPDATE, DELETE)
    this.subscribeToTable('client_ledger', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        this.showNotification('📋 New Ledger Entry', `Client ledger entry added`, 'info');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Ledger Updated', `Client ledger modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Ledger Deleted', `Ledger entry removed`, 'warning');
      }
    });

    // Listen to workers master (INSERT, UPDATE, DELETE)
    this.subscribeToTable('workers_master', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        this.showNotification('👷 New Worker', `${data.name} added`, 'success');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Worker Updated', `${data.name} details modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Worker Deleted', `${data.name} removed`, 'warning');
      }
    });

    // ========== LIBRARY TABLES ==========

    // Listen to library students (INSERT, UPDATE, DELETE)
    this.subscribeToTable('library_students', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        this.showNotification('👨‍🎓 New Student', `${data.name} enrolled`, 'success');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Student Updated', `${data.name} details modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Student Deleted', `${data.name} removed`, 'warning');
      }
    });

    // Listen to library expenses (INSERT, UPDATE, DELETE)
    this.subscribeToTable('library_expenses', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        this.showNotification('💸 Library Expense', `₹${data.amount.toLocaleString('en-IN')} - ${data.description}`, 'warning');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Expense Updated', `₹${data.amount.toLocaleString('en-IN')} expense modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Expense Deleted', `Expense entry removed`, 'warning');
      }
    });

    // Listen to library fee payments (INSERT, UPDATE, DELETE)
    this.subscribeToTable('library_fee_payments', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        this.showNotification('💰 Library Fee Payment', `₹${data.amount.toLocaleString('en-IN')} received`, 'success');
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Payment Updated', `Fee payment modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Payment Deleted', `Payment removed`, 'warning');
      }
    });

    // Listen to library cash ledger (INSERT, UPDATE, DELETE)
    this.subscribeToTable('library_cash_ledger', (payload) => {
      const data = payload.new || payload.old as any;
      if (payload.eventType === 'INSERT') {
        if (data.type === 'receipt') {
          this.showNotification('💵 Library Income', `₹${data.amount.toLocaleString('en-IN')} - ${data.description}`, 'success');
        } else {
          this.showNotification('💸 Library Expense', `₹${data.amount.toLocaleString('en-IN')} - ${data.description}`, 'warning');
        }
      } else if (payload.eventType === 'UPDATE') {
        this.showNotification('✏️ Ledger Updated', `Cash ledger entry modified`, 'info');
      } else if (payload.eventType === 'DELETE') {
        this.showNotification('🗑️ Ledger Deleted', `Cash entry removed`, 'warning');
      }
    });

    console.log('✅ Notifications enabled for 11 tables (7 Manufacturing + 4 Library)');
  }

  // Subscribe to a specific table
  private subscribeToTable(tableName: string, callback: (payload: DatabasePayload) => void) {
    const channel = this.supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          // Don't notify for own changes (optional)
          // if (payload.new?.user_id === this.currentUserId) return;
          
          callback(payload as DatabasePayload);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${tableName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to ${tableName}:`, err);
          console.error(`💡 Fix: Execute ENABLE_REALTIME_NOTIFICATIONS.sql in Supabase Dashboard`);
        } else if (status === 'TIMED_OUT') {
          console.error(`⏱️ Timeout subscribing to ${tableName}`);
        } else if (status === 'CLOSED') {
          console.warn(`🔒 Channel closed for ${tableName}`);
        }
      });

    this.channels.push(channel);
  }

  // Stop all notifications
  stopListening() {
    console.log('🔕 Stopping notifications...');
    this.channels.forEach(channel => {
      this.supabase.removeChannel(channel);
    });
    this.channels = [];
  }

  // Show notification using Toastr
  private showNotification(
    title: string, 
    message: string, 
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) {
    this.toastr[type](message, title, {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      enableHtml: true
    });
  }

  // Public method for custom notifications
  notify(title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    this.showNotification(title, message, type);
  }

  // Helper to get readable category name
  private getCategoryName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'wage': 'Worker Wages',
      'sales': 'Sales Income',
      'partner_contribution': 'Partner Contribution',
      'partner_withdrawal': 'Partner Withdrawal',
      'purchase': 'Material Purchase',
      'operational': 'Operational Expense',
      'adjustment': 'Balance Adjustment'
    };
    return categoryMap[category] || category;
  }

  // ========== NOTIFICATION INBOX METHODS ==========

  /**
   * Fetch all unread notifications for the current user
   * Call this on app startup/resume to sync missed notifications
   */
  async getUnreadNotifications(): Promise<NotificationRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching unread notifications:', error);
        return [];
      }

      console.log(`📬 Fetched ${data?.length || 0} unread notifications`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching unread notifications:', error);
      return [];
    }
  }

  /**
   * Fetch all notifications (read + unread) with pagination
   */
  async getAllNotifications(limit: number = 50, offset: number = 0): Promise<NotificationRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error fetching all notifications:', error);
        return [];
      }

      console.log(`📬 Fetched ${data?.length || 0} notifications`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching all notifications:', error);
      return [];
    }
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Exception getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error marking notification as read:', error);
        return false;
      }

      console.log(`✅ Marked notification ${notificationId} as read`);
      return true;
    } catch (error) {
      console.error('❌ Exception marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        console.error('❌ No user logged in');
        return false;
      }

      const { error } = await this.supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id
      });

      if (error) {
        console.error('❌ Error marking all as read:', error);
        return false;
      }

      console.log('✅ Marked all notifications as read');
      return true;
    } catch (error) {
      console.error('❌ Exception marking all as read:', error);
      return false;
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error deleting notification:', error);
        return false;
      }

      console.log(`✅ Deleted notification ${notificationId}`);
      return true;
    } catch (error) {
      console.error('❌ Exception deleting notification:', error);
      return false;
    }
  }

  /**
   * Sync missed notifications when app comes to foreground
   * Shows toasts for unread notifications
   */
  async syncMissedNotifications(): Promise<void> {
    console.log('🔄 Syncing missed notifications...');
    
    const unreadNotifications = await this.getUnreadNotifications();
    
    if (unreadNotifications.length > 0) {
      console.log(`📬 Found ${unreadNotifications.length} missed notifications`);
      
      // Show toast for each missed notification (limit to 5 to avoid spam)
      const notificationsToShow = unreadNotifications.slice(0, 5);
      
      notificationsToShow.forEach((notification, index) => {
        setTimeout(() => {
          this.showNotification(
            notification.title,
            notification.content,
            notification.type
          );
        }, index * 500); // Stagger by 500ms to avoid overwhelming user
      });

      if (unreadNotifications.length > 5) {
        setTimeout(() => {
          this.showNotification(
            '📬 More Notifications',
            `You have ${unreadNotifications.length - 5} more unread notifications`,
            'info'
          );
        }, 2500);
      }
    } else {
      console.log('✅ No missed notifications');
    }
  }

  /**
   * Subscribe to new notifications in real-time
   * This watches the notifications table for INSERT events
   */
  subscribeToNotificationUpdates(callback: (notification: NotificationRecord) => void) {
    const channel = this.supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.currentUserId}`
        },
        (payload: any) => {
          console.log('📨 New notification received:', payload.new);
          const notification = payload.new as NotificationRecord;
          
          // Show toast
          this.showNotification(
            notification.title,
            notification.content,
            notification.type
          );
          
          // Call callback
          callback(notification);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to notification updates');
        }
      });

    this.channels.push(channel);
  }
}
