// src/app/pages/admin-manage/admin-manage.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';

interface ManagementModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  category: 'Manufacturing' | 'Library' | 'System';
  operations: string[];
}

@Component({
  selector: 'app-admin-manage',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './admin-manage.component.html',
  styleUrls: ['./admin-manage.component.css']
})
export class AdminManageComponent implements OnInit {
  modules: ManagementModule[] = [
    // Manufacturing Modules
    {
      id: 'clients',
      title: 'Client Management',
      description: 'Add, edit, delete clients and manage credit limits',
      icon: 'business',
      route: '/manage/clients',
      category: 'Manufacturing',
      operations: ['View', 'Add', 'Edit', 'Delete']
    },
    {
      id: 'workers',
      title: 'Worker Management',
      description: 'Manage workers and labour records',
      icon: 'engineering',
      route: '/manage/workers',
      category: 'Manufacturing',
      operations: ['View', 'Add', 'Edit', 'Delete']
    },
    {
      id: 'products',
      title: 'Product Management',
      description: 'Manage finished goods inventory and products',
      icon: 'inventory_2',
      route: '/manage/products',
      category: 'Manufacturing',
      operations: ['View', 'Add', 'Edit', 'Delete']
    },
    {
      id: 'materials',
      title: 'Raw Materials',
      description: 'Manage raw materials stock and suppliers',
      icon: 'category',
      route: '/manage/materials',
      category: 'Manufacturing',
      operations: ['View', 'Add', 'Edit', 'Delete']
    },
    {
      id: 'sales',
      title: 'Sales Orders',
      description: 'Manage and delete sales transactions',
      icon: 'shopping_cart',
      route: '/manage/sales',
      category: 'Manufacturing',
      operations: ['View', 'Edit', 'Delete']
    },
    {
      id: 'production',
      title: 'Production Entries',
      description: 'Manage production records and corrections',
      icon: 'precision_manufacturing',
      route: '/manage/production',
      category: 'Manufacturing',
      operations: ['View', 'Edit', 'Delete']
    },

    // Library Modules
    {
      id: 'library-students',
      title: 'Student Management',
      description: 'Manage library students and enrollments',
      icon: 'school',
      route: '/manage/library-students',
      category: 'Library',
      operations: ['View', 'Add', 'Edit', 'Delete']
    },
    {
      id: 'library-expenses',
      title: 'Library Expenses',
      description: 'Manage library operational expenses',
      icon: 'receipt_long',
      route: '/manage/library-expenses',
      category: 'Library',
      operations: ['View', 'Edit', 'Delete']
    },
    {
      id: 'library-seats',
      title: 'Seat Management',
      description: 'Manage seat allocations and availability',
      icon: 'event_seat',
      route: '/manage/library-seats',
      category: 'Library',
      operations: ['View', 'Edit']
    }
  ];

  filteredModules: ManagementModule[] = [];
  selectedCategory: 'All' | 'Manufacturing' | 'Library' | 'System' = 'All';
  categories: Array<'All' | 'Manufacturing' | 'Library' | 'System'> = ['All', 'Manufacturing', 'Library', 'System'];

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.filterModules();
  }

  filterModules() {
    if (this.selectedCategory === 'All') {
      this.filteredModules = this.modules;
    } else {
      this.filteredModules = this.modules.filter(m => m.category === this.selectedCategory);
    }
  }

  selectCategory(category: 'All' | 'Manufacturing' | 'Library' | 'System') {
    this.selectedCategory = category;
    this.filterModules();
  }

  navigateToModule(route: string) {
    this.router.navigate([route]);
  }
}
