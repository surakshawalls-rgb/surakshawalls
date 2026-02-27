import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DigitalLibraryService } from '../../services/digital-library.service';

@Component({
  selector: 'app-public-resources',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatCardModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './public-resources.component.html',
  styleUrls: ['./public-resources.component.css']
})
export class PublicResourcesComponent implements OnInit {
  
  books: any[] = [];
  filteredBooks: any[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'all';

  categories = [
    { value: 'all', label: 'All Books' },
    { value: 'competitive', label: 'Competitive Exams' },
    { value: 'academic', label: 'Academic' },
    { value: 'reference', label: 'Reference' },
    { value: 'magazines', label: 'Magazines' }
  ];

  constructor(
    private router: Router,
    private libraryService: DigitalLibraryService
  ) {}

  ngOnInit() {
    this.loadBooks();
  }

  async loadBooks() {
    try {
      this.books = await this.libraryService.getBooks();
      this.filteredBooks = this.books;
    } catch (error) {
      console.error('Error loading books:', error);
      // For demo, show sample books
      this.books = this.getSampleBooks();
      this.filteredBooks = this.books;
    }
  }

  getSampleBooks() {
    return [
      { id: 1, title: 'UPSC General Studies', author: 'Laxmikant', category: 'competitive', available: true, description: 'Complete guide for UPSC preparation' },
      { id: 2, title: 'Indian Polity', author: 'M. Laxmikant', category: 'competitive', available: true, description: 'Comprehensive study of Indian Constitution' },
      { id: 3, title: 'Mathematics Class 12', author: 'R.D. Sharma', category: 'academic', available: false, description: 'Complete mathematics for class 12' },
      { id: 4, title: 'Physics Vol 1', author: 'HC Verma', category: 'academic', available: true, description: 'Concepts of Physics Volume 1' },
      { id: 5, title: 'English Grammar', author: 'Wren & Martin', category: 'reference', available: true, description: 'High School English Grammar' },
      { id: 6, title: 'Current Affairs 2026', author: 'Various', category: 'magazines', available: true, description: 'Monthly current affairs compilation' },
      { id: 7, title: 'Indian Economy', author: 'Ramesh Singh', category: 'competitive', available: true, description: 'For UPSC Civil Services' },
      { id: 8, title: 'History of Modern India', author: 'Bipin Chandra', category: 'competitive', available: false, description: 'Modern Indian history for competitive exams' }
    ];
  }

  filterBooks() {
    let filtered = this.books;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(book => book.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term)
      );
    }

    this.filteredBooks = filtered;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterBooks();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  inquireForMembership() {
    this.router.navigate(['/library/inquiry']);
  }
}
