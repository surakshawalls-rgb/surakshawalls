import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NotificationInboxComponent } from './components/notification-inbox/notification-inbox.component';
import { NotificationService } from './services/notification.service';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    MatMenuModule, 
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    NotificationInboxComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {

  public router: Router;
  public authService: AuthService;
  private breakpointObserver: BreakpointObserver;
  private notificationService: NotificationService;
  private pushNotificationService: PushNotificationService;

  isHandset$: Observable<boolean>;

  constructor(
    router: Router,
    authService: AuthService,
    breakpointObserver: BreakpointObserver,
    notificationService: NotificationService,
    pushNotificationService: PushNotificationService
  ) {
    console.log("✅ AppComponent Constructor started");
    
    this.router = router;
    this.authService = authService;
    this.breakpointObserver = breakpointObserver;
    this.notificationService = notificationService;
    this.pushNotificationService = pushNotificationService;
    
    this.isHandset$ = this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        console.log("➡ Route Changed:", event);
      });
      
    console.log("✅ AppComponent Constructor completed");
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  public isLabourStaff(): boolean {
    return this.authService.isLabourStaff();
  }

  public hasManufacturingAccess(): boolean {
    // Labour staff should NOT see full manufacturing menu
    return this.authService.hasAccess('manufacturing') && !this.isLabourStaff();
  }

  public hasLibraryAccess(): boolean {
    return this.authService.hasAccess('library');
  }

  public hasFullLibraryAccess(): boolean {
    return this.authService.isAdmin() || 
           this.authService.isEditor() || 
           this.authService.isLibraryManager();
  }

  public async logout(): Promise<void> {
    await this.authService.logout();
    window.location.href = '/login';
  }

  ngOnInit() {
    console.log('🚀 AppComponent ngOnInit started');
    this.initializeServices();
    this.setupAppStateListeners();
  }

  private async initializeServices(): Promise<void> {
    try {
      console.log('🔄 Initializing services...');
      
      // Start real-time notifications
      this.notificationService.startListening();
      console.log('✅ Real-time notifications active');
      
      // Sync missed notifications on startup
      setTimeout(async () => {
        await this.notificationService.syncMissedNotifications();
      }, 2000);
      
      // Initialize push notifications (mobile only)
      console.log('🔄 About to initialize push notifications...');
      setTimeout(async () => {
        try {
          console.log('🔄 Calling initializePushNotifications...');
          await this.pushNotificationService.initializePushNotifications();
          console.log('✅ Push notifications initialized');
        } catch (e: any) {
          console.error('❌ Push notifications error:', e);
          console.error('❌ Error message:', e.message);
          console.error('❌ Error stack:', e.stack);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error initializing services:', error);
    }
  }

  /**
   * Setup app state listeners for foreground/background transitions
   * Syncs missed notifications when app comes to foreground
   */
  private setupAppStateListeners(): void {
    // Web: Listen to page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          console.log('📱 App came to foreground (web)');
          await this.syncNotifications();
        }
      });
    }

    // Mobile: Listen to Capacitor App state changes
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const loadApp = new Function('return import("@capacitor/app")');
      loadApp().then((AppModule: any) => {
        AppModule.App.addListener('appStateChange', async (state: any) => {
          if (state.isActive) {
            console.log('📱 App came to foreground (mobile)');
            await this.syncNotifications();
          }
        });
        console.log('✅ App state listener registered');
      }).catch(() => {
        console.log('⚠️ Capacitor App plugin not available');
      });
    }

    // Web: Listen to online/offline events
    window.addEventListener('online', async () => {
      console.log('🌐 Network connection restored');
      await this.syncNotifications();
    });
  }

  /**
   * Sync missed notifications
   */
  private async syncNotifications(): Promise<void> {
    try {
      await this.notificationService.syncMissedNotifications();
    } catch (error) {
      console.log('⚠️ Could not sync notifications:', error);
    }
  }
}