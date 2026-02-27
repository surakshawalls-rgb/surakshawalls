import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { ProductionService } from '../../services/production.service';

@Component({
  selector: 'app-walls-masters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    BreadcrumbComponent
  ],
  templateUrl: './masters.component.html',
  styleUrls: ['./masters.component.css']
})
export class MastersComponent implements OnInit {

  activeTab = 0;

  // Product Master
  products: any[] = [];
  showProductForm = false;
  productForm: any = {
    product_name: '',
    category: 'concrete',
    specifications: '',
    default_rate: 0,
    active: true
  };

  // Material Master
  materials: any[] = [];
  showMaterialForm = false;
  materialForm: any = {
    material_name: '',
    category: 'cement',
    unit: 'kg',
    current_rate: 0,
    active: true
  };

  // Rate Card
  rateCards: any[] = [];
  showRateCardForm = false;
  rateCardForm: any = {
    product_name: '',
    variant: '',
    rate: 0,
    effective_from: new Date().toISOString().split('T')[0],
    active: true
  };

  loading = false;

  constructor(private productionService: ProductionService) {}

  async ngOnInit() {
    await this.loadAllMasters();
  }

  async loadAllMasters() {
    this.loading = true;
    try {
      // Load product master data
      // TODO: Implement actual data loading
      this.products = [];
      this.materials = [];
      this.rateCards = [];
    } catch (error) {
      console.error('Error loading masters:', error);
    } finally {
      this.loading = false;
    }
  }

  // Product Master Methods
  openProductForm() {
    this.productForm = {
      product_name: '',
      category: 'concrete',
      specifications: '',
      default_rate: 0,
      active: true
    };
    this.showProductForm = true;
  }

  saveProduct() {
    // TODO: Implement actual save
    alert('Product saved! (Database implementation pending)');
    this.showProductForm = false;
  }

  // Material Master Methods
  openMaterialForm() {
    this.materialForm = {
      material_name: '',
      category: 'cement',
      unit: 'kg',
      current_rate: 0,
      active: true
    };
    this.showMaterialForm = true;
  }

  saveMaterial() {
    // TODO: Implement actual save
    alert('Material saved! (Database implementation pending)');
    this.showMaterialForm = false;
  }

  // Rate Card Methods
  openRateCardForm() {
    this.rateCardForm = {
      product_name: '',
      variant: '',
      rate: 0,
      effective_from: new Date().toISOString().split('T')[0],
      active: true
    };
    this.showRateCardForm = true;
  }

  saveRateCard() {
    // TODO: Implement actual save
    alert('Rate card saved! (Database implementation pending)');
    this.showRateCardForm = false;
  }
}
