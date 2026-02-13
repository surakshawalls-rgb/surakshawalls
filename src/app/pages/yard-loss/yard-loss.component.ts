// src/app/pages/yard-loss/yard-loss.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WastageService } from '../../services/wastage.service';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-yard-loss',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './yard-loss.component.html',
  styleUrls: ['./yard-loss.component.css']
})
export class YardLossComponent implements OnInit {
  date: string = new Date().toISOString().split('T')[0];
  productName: string = '';
  quantity: number = 0;
  stage: 'stacking' | 'loading' | 'transport' = 'stacking';
  reason: string = '';
  notes: string = '';

  products: any[] = [];
  wastageHistory: any[] = [];

  loading: boolean = false;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private wastageService: WastageService,
    private recipeService: RecipeService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      const [productList, history] = await Promise.all([
        this.recipeService.getProductList(),
        this.wastageService.getYardLossHistory()
      ]);
      this.products = productList.map(p => p.product_name);
      this.wastageHistory = history.slice(0, 20);
    } catch (error: any) {
      this.errorMessage = 'Failed to load data: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async recordLoss() {
    if (!this.productName || this.quantity <= 0) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    try {
      this.saving = true;
      const result = await this.wastageService.recordYardLoss({
        date: this.date,
        product_name: this.productName,
        quantity: this.quantity,
        stage: this.stage,
        reason: this.reason || undefined,
        notes: this.notes || undefined
      });

      if (result.success) {
        this.successMessage = 'Yard loss recorded successfully!';
        this.resetForm();
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to record yard loss';
      }
    } catch (error: any) {
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
    }
  }

  resetForm() {
    this.date = new Date().toISOString().split('T')[0];
    this.productName = '';
    this.quantity = 0;
    this.stage = 'stacking';
    this.reason = '';
    this.notes = '';
  }

  formatProductName(name: string): string {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
}
