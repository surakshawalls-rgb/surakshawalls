import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed 
} from '@capacitor/push-notifications';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private isPushAvailable = false;
  private supabase!: SupabaseClient;
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

  constructor() {
    console.log('📱 PushNotificationService constructor started');
    console.log('📱 Capacitor available:', typeof Capacitor !== 'undefined');
    
    try {
      this.isPushAvailable = Capacitor.isNativePlatform();
      console.log('📱 Is native platform:', this.isPushAvailable);
      console.log('📱 Current platform:', Capacitor.getPlatform());
      
      // Use the authenticated supabase client from SupabaseService
      this.supabase = this.supabaseService.supabase;
      console.log('✅ Using authenticated Supabase client');
    } catch (error) {
      console.error('❌ Error in PushNotificationService constructor:', error);
    }
  }

  /**
   * Initialize push notifications
   * Call this in app.component.ts ngOnInit()
   */
  async initializePushNotifications(): Promise<void> {
    console.log('📱 initializePushNotifications called');
    
    if (!this.isPushAvailable) {
      console.log('⚠️ Push notifications only available on native platforms (Android/iOS)');
      console.log('💡 Current platform:', Capacitor.getPlatform());
      return;
    }

    try {
      console.log('📱 Requesting push notification permissions...');
      
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      console.log('📱 Permission status:', permStatus);
      
      if (permStatus.receive === 'granted') {
        console.log('✅ Push notification permission granted');
        
        // Add listeners FIRST (before registration)
        this.addListeners();
        
        // Register with Apple / Google to receive push via APNS/FCM
        console.log('📱 Registering with FCM...');
        await PushNotifications.register();
        console.log('✅ FCM registration initiated');
        
        // Add timeout to check if registration callback fires
        setTimeout(() => {
          console.log('⏰ 30 seconds passed - checking if token was received...');
          console.log('⏰ If no token received, there may be a Firebase configuration issue');
        }, 30000);
        
      } else if (permStatus.receive === 'denied') {
        console.warn('⚠️ Push notification permission denied');
      } else {
        console.warn('⚠️ Push notification permission status:', permStatus.receive);
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      console.error('❌ Error details:', JSON.stringify(error));
      // Don't throw - let the app continue
    }
  }

  /**
   * Add listeners for push notification events
   */
  private addListeners(): void {
    try {
      console.log('📱 Adding push notification listeners...');
      
      // Called when a new FCM token is generated
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('🎉 ========== FCM TOKEN RECEIVED ==========');
        console.log('📱 Push registration success!');
        console.log('📱 FCM Token:', token.value);
        console.log('📱 Token length:', token.value ? token.value.length : 0);
        console.log('===========================================');
        
        // Save token to backend
        this.saveTokenToBackend(token.value)
          .then(() => console.log('✅ Token save completed'))
          .catch((err: any) => console.error('❌ Token save failed:', err));
      });

      // Called when registration fails
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('🔴 ========== FCM REGISTRATION ERROR ==========');
        console.error('❌ Push registration error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', JSON.stringify(error));
        console.error('==============================================');
      });

      // Called when a push notification is received (foreground)
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('📨 Push notification received (foreground)');
          console.log('📨 Notification:', JSON.stringify(notification));
          
          // Show in-app notification when app is open
          this.showInAppNotification(notification);
        }
      );

      // Called when user taps on a notification
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('👆 Push notification action performed');
          console.log('👆 Action:', JSON.stringify(notification));
          
          // Handle navigation based on notification data
          this.handleNotificationAction(notification);
        }
      );
      
      console.log('✅ Push notification listeners added');
    } catch (error) {
      console.error('❌ Error adding listeners:', error);
    }
  }

  /**
   * Save FCM token to backend (Supabase)
   * This token will be used to send push notifications to this device
   */
  private async saveTokenToBackend(token: string): Promise<void> {
    try {
      console.log('💾 Saving token to Supabase...');
      console.log('💾 Token preview:', token.substring(0, 20) + '...');
      
      const platform = Capacitor.getPlatform(); // 'android' or 'ios'
      const currentUser = this.authService.currentUserValue;
      const user_id = currentUser?.id || 'anonymous_user';
      
      console.log('💾 Platform:', platform);
      console.log('💾 User ID:', user_id);
      
      const { data, error } = await this.supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user_id,
          fcm_token: token,
          platform: platform,
          device_name: `${platform} Device`,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'fcm_token' // Update if token already exists
        })
        .select();
      
      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', JSON.stringify(error));
      } else {
        console.log('✅ Token saved successfully!');
        console.log('✅ Saved data:', JSON.stringify(data));
      }
    } catch (error) {
      console.error('❌ Exception saving token:', error);
      console.error('❌ Exception details:', JSON.stringify(error));
    }
  }

  /**
   * Show in-app notification when app is in foreground
   */
  private showInAppNotification(notification: PushNotificationSchema): void {
    console.log('🔔 Push notification received in foreground');
    console.log('📨 Title:', notification.title);
    console.log('📨 Body:', notification.body);
    // In-app toast will be shown by the app's notification service
  }

  /**
   * Handle actions when user taps on a notification
   */
  private handleNotificationAction(notification: ActionPerformed): void {
    const data = notification.notification.data;
    
    console.log('📍 Notification data:', data);
    
    // Navigate based on notification type
    if (data.type === 'wage_entry') {
      // Navigate to wage entries page
      // this.router.navigate(['/labour']);
    } else if (data.type === 'expense') {
      // Navigate to expenses page
      // this.router.navigate(['/company-cash']);
    }
    // Add more navigation logic based on your needs
  }

  /**
   * Get all pending notifications (Android only)
   */
  async getDeliveredNotifications(): Promise<void> {
    const notifications = await PushNotifications.getDeliveredNotifications();
    console.log('📬 Delivered notifications:', notifications);
  }

  /**
   * Remove all delivered notifications (clear notification tray)
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    await PushNotifications.removeAllDeliveredNotifications();
    console.log('🗑️ All delivered notifications removed');
  }

  /**
   * Check if push notifications are available
   */
  isPushNotificationAvailable(): boolean {
    return this.isPushAvailable;
  }
}
