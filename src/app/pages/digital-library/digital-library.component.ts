import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DigitalLibraryService, BookCategory, ResourceLink } from '../../services/digital-library.service';

@Component({
  selector: 'app-digital-library',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './digital-library.component.html',
  styleUrls: ['./digital-library.component.css']
})
export class DigitalLibraryComponent implements OnInit {
  categories: BookCategory[] = [];
  resourceLinks: ResourceLink[] = [];
  searchQuery: string = '';
  selectedCategory: string = 'all';
  loading: boolean = true;

  // Stats
  stats = {
    totalBooks: 1000,
    totalResources: 162,
    activeUsers: 250,
    totalDownloads: 5420
  };

  constructor(
    private digitalLibrary: DigitalLibraryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      this.cdr.detectChanges();
      this.categories = await this.digitalLibrary.getCategories();
      this.resourceLinks = this.digitalLibrary.getOfficialResourceLinks();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  filterResources(category: string) {
    this.selectedCategory = category;
    this.cdr.detectChanges();
  }

  getFilteredResources(): ResourceLink[] {
    if (this.selectedCategory === 'all') {
      return this.resourceLinks;
    }
    return this.resourceLinks.filter(r => 
      r.category === this.selectedCategory || r.category === 'All'
    );
  }

  searchResources() {
    if (this.searchQuery.trim()) {
      // Navigate to search results or filter
      console.log('Searching for:', this.searchQuery);
    }
  }

  openLink(url: string) {
    console.log('Opening URL:', url);
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (opened) {
      // Show success message
      this.showMessage('Opening official website in new tab...', 'success');
    } else {
      // Popup blocked
      this.showMessage('Please allow popups for this site to open links', 'error');
      // Fallback: try direct location change
      window.location.href = url;
    }
  }

  private messageTimeout: any;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.message = msg;
    this.messageType = type;
    
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    
    this.messageTimeout = setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'School': '#4CAF50',
      'UPSC': '#FF9800',
      'SSC': '#9C27B0',
      'Banking': '#00BCD4',
      'Railway': '#F44336',
      'General': '#607D8B',
      'All': '#2196F3'
    };
    return colors[category] || '#777';
  }
}
