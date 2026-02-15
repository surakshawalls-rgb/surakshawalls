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
    
    // Note: Notification services are automatically initialized via Angular's DI
    // when the app runs on mobile. Web version doesn't require them.
  }
}

