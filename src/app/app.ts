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

// Conditional type for mobile services (not available during build)
type NotificationServiceType = any;
type PushNotificationServiceType = any;

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
export class AppComponent implements OnInit {

  public router: Router;
  public authService: AuthService;
  private breakpointObserver: BreakpointObserver;

  isHandset$: Observable<boolean>;

  constructor(
    router: Router,
    authService: AuthService,
    breakpointObserver: BreakpointObserver
  ) {
    console.log("✅ AppComponent Constructor started");
    
    this.router = router;
    this.authService = authService;
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
    
    // Initialize notification services on runtime (after build)
    if (typeof window !== 'undefined') {
      this.initializeServices();
    }
  }

  private async initializeServices(): Promise<void> {
    // Only run on actual runtime, not during SSR
    try {
      // Check if we're in a browser environment
      if (typeof document === 'undefined') return;
      
      // Use Function constructor to avoid TypeScript resolving imports during build
      const loadService = new Function('path', 'return import(path)');
      
      // Load notification service
      const notifModule: any = await loadService('./services/notification.service');
      const notificationService: any = inject(notifModule.NotificationService);
      
      // Start real-time notifications
      notificationService.startListening();
      console.log('✅ Real-time notifications active');
      
      // Load and initialize push notifications after delay (mobile only)
      setTimeout(async () => {
        try {
          const pushModule: any = await loadService('./services/push-notification.service');
          const pushNotificationService: any = inject(pushModule.PushNotificationService);
          
          await pushNotificationService.initializePushNotifications();
          console.log('✅ Push notifications initialized');
        } catch (e: any) {
          console.log('⚠️ Push notifications not available:', e.message);
        }
      }, 3000);
      
    } catch (error: any) {
      // Services not available (Vercel build) - silently continue
      console.log('⚠️ Mobile services not available (web mode)');
    }
  }
}

