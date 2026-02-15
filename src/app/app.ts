import { Component, inject, OnInit, OnDestroy, Injector } from '@angular/core';
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
    MatDividerModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {

  public router: Router;
  public authService: AuthService;
  private injector: Injector;
  private breakpointObserver: BreakpointObserver;

  isHandset$: Observable<boolean>;

  constructor(
    router: Router,
    authService: AuthService,
    injector: Injector,
    breakpointObserver: BreakpointObserver
  ) {
    console.log("✅ AppComponent Constructor started");
    
    this.router = router;
    this.authService = authService;
    this.injector = injector;
    this.breakpointObserver = breakpointObserver;
    
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

  public hasManufacturingAccess(): boolean {
    return this.authService.hasAccess('manufacturing');
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
    
    // Initialize services dynamically to avoid build issues
    this.initializeNotificationServices();
  }

  private async initializeNotificationServices() {
    try {
      // Dynamically import and initialize notification service
      const { NotificationService } = await import('./services/notification.service');
      const notificationService = this.injector.get(NotificationService);
      
      // Start listening to database changes for real-time notifications (in-app)
      notificationService.startListening();
      console.log('✅ Notification service started');
      
      // Show welcome notification after delay
      setTimeout(() => {
        try {
          notificationService.notify(
            'Welcome! 👋',
            'Real-time notifications are active',
            'success'
          );
        } catch (error: any) {
          console.error('❌ Error showing welcome notification:', error);
        }
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error starting notification service:', error);
    }
    
    // Initialize push notifications AFTER a delay to not block app startup
    setTimeout(async () => {
      try {
        console.log('⏰ Attempting push notification initialization...');
        const { PushNotificationService } = await import('./services/push-notification.service');
        const pushNotificationService = this.injector.get(PushNotificationService);
        
        pushNotificationService.initializePushNotifications()
          .then(() => console.log('✅ Push notification initialization complete'))
          .catch((error: any) => {
            console.error('❌ Error initializing push notifications:', error);
            // Don't let this crash the app
          });
      } catch (error: any) {
        console.error('❌ Error calling push notification init:', error);
        // Don't let this crash the app
      }
    }, 3000); // Wait 3 seconds after app loads
  }

  ngOnDestroy() {
    // Clean up subscriptions when component is destroyed
    try {
      import('./services/notification.service').then(({ NotificationService }) => {
        const notificationService = this.injector.get(NotificationService);
        notificationService.stopListening();
      });
    } catch (error: any) {
      console.error('❌ Error in ngOnDestroy:', error);
    }
  }
}
