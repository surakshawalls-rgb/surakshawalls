import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {

  public router = inject(Router);
  public authService = inject(AuthService);

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
    // Only admin, editor, and library_manager can see full library menu
    // library_viewer and viewer can only see the grid
    return this.authService.isAdmin() || 
           this.authService.isEditor() || 
           this.authService.isLibraryManager();
  }

  public async logout(): Promise<void> {
    await this.authService.logout();
    // Use window.location for hard redirect after logout to avoid guard issues
    window.location.href = '/login';
  }

  debug(msg: string) {
  console.log("🧭 MENU CLICK:", msg);
}

  closeMenu() {
    // Find all open details elements in the menu and close them
    const menuBar = document.querySelector('.menu-bar');
    if (menuBar) {
      const openDetails = menuBar.querySelectorAll('details[open]');
      openDetails.forEach((detail: Element) => {
        (detail as HTMLDetailsElement).open = false;
      });
    }
  }

  constructor() {
    console.log("✅ AppComponent Loaded");

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        console.log("➡ Route Changed:", event);
        // Auto-close all menus after navigation
        this.closeMenu();
      });
  }
}
