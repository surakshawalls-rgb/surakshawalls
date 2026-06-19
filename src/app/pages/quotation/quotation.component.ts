import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-quotation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule
  ],
  templateUrl: './quotation.component.html',
  styleUrls: ['./quotation.component.css']
})
export class QuotationComponent {
  // Form inputs
  calculationType: 'boundary' | 'fencing' | 'manual' = 'boundary';
  landSize: number = 1; // in biswa
  wallHeight: number = 6; // in feet (for boundary walls)
  customLandSize: boolean = false;
  // Manual mode sub-option: behaves like either a boundary or fencing quote
  manualOption: 'boundary' | 'fencing' = 'boundary';

  // Manual inputs (used when calculationType === 'manual')
  manualBoundaryRate: number = 85; // ₹/sq ft
  manualPolesCount: number = 0;
  manualPolePrice: number = 0;
  manualWireCost: number = 0; // total wire cost entered manually
  
  // Results
  totalCost: number = 0;
  calculationDetails: any = {};
  showResults: boolean = false;

  // Perimeter lookup table (in feet) - from your pricing images
  perimeterTable: { [key: number]: number } = {
    1: 150,
    2: 210,
    3: 260,
    5: 330,
    10: 470,
    20: 660
  };

  // Available options
  availableLandSizes = [1, 2, 3, 5, 10, 20];
  availableHeights = [4, 5, 6, 7, 8, 9, 10];

  calculate() {
    this.calculationDetails = {};
    
    if (this.calculationType === 'boundary') {
      this.calculateBoundaryWall();
    } else if (this.calculationType === 'fencing') {
      this.calculateFencing();
    } else {
      this.calculateManual();
    }
    
    this.showResults = true;
  }

  calculateManual() {
    const perimeter = this.getPerimeter(this.landSize);
    this.calculationDetails = {};
    // Manual boundary
    if (this.manualOption === 'boundary') {
      const ratePerSqFt = Number(this.manualBoundaryRate) || 0;
      const totalArea = perimeter * this.wallHeight;
      this.totalCost = Math.round(totalArea * ratePerSqFt);

      this.calculationDetails = {
        'Land Size': `${this.landSize} biswa`,
        'Perimeter': `${perimeter} feet`,
        'Wall Height': `${this.wallHeight} feet`,
        'Total Wall Area': `${totalArea} sq ft`,
        'Rate': `₹${ratePerSqFt}/sq ft (user provided)`,
        'Total Cost': `₹${this.totalCost.toLocaleString('en-IN')}`
      };
      return;
    }

    // Manual fencing
    const totalPoles = Number(this.manualPolesCount) || 0;
    const poleCost = totalPoles * (Number(this.manualPolePrice) || 0);
    const wireCost = Number(this.manualWireCost) || 0;

    // Labour cost: keep existing labour formula for consistency
    let labourCost = 0;
    if (this.landSize === 1) {
      labourCost = 1000;
    } else {
      labourCost = 1800 + (Math.max(0, this.landSize - 2) * 700);
    }

    this.totalCost = Math.round(poleCost + wireCost + labourCost);

    this.calculationDetails = {
      'Land Size': `${this.landSize} biswa`,
      'Perimeter': `${perimeter} feet`,
      'Total Poles (user)': `${totalPoles}`,
      'Pole Cost (user provided)': `₹${poleCost.toLocaleString('en-IN')}`,
      'Barbed Wire (user provided)': `₹${wireCost.toLocaleString('en-IN')}`,
      'Labour & Installation': `₹${labourCost.toLocaleString('en-IN')}`,
      'Total Cost': `₹${this.totalCost.toLocaleString('en-IN')}`
    };
  }

  calculateBoundaryWall() {
    const perimeter = this.getPerimeter(this.landSize);
    const ratePerSqFt = 85;
    
    // Formula: Perimeter × Height × ₹85 per sq ft
    this.totalCost = perimeter * this.wallHeight * ratePerSqFt;
    
    this.calculationDetails = {
      'Land Size': `${this.landSize} biswa`,
      'Perimeter': `${perimeter} feet`,
      'Wall Height': `${this.wallHeight} feet`,
      'Total Wall Area': `${perimeter * this.wallHeight} sq ft`,
      'Rate': `₹${ratePerSqFt}/sq ft (includes material + installation)`,
      'Total Cost': `₹${this.totalCost.toLocaleString('en-IN')}`
    };
  }

  calculateFencing() {
    const perimeter = this.getPerimeter(this.landSize);
    
    // Step 1: Calculate poles
    // Poles needed = (perimeter / 10) + 4 corner supports
    const regularPoles = Math.floor(perimeter / 10);
    const cornerSupports = 4;
    const totalPoles = regularPoles + cornerSupports;
    
    // Step 2: Pole cost (₹300 per pole)
    const poleCost = totalPoles * 300;
    
    // Step 3: Wire calculation
    // On every 2 poles, 1.3 kg of wire required
    // Barbed wire is ₹110 per kg
    const wireWeight = (totalPoles / 2) * 1.3;
    const wireCostPerKg = 110;
    const wireCost = Math.round(wireWeight * wireCostPerKg);
    
    // Step 4: Labour cost
    let labourCost = 0;
    if (this.landSize === 1) {
      labourCost = 1000;
    } else {
      // For n biswa where n >= 2: ₹1,800 + (n-2) × ₹700
      labourCost = 1800 + (Math.max(0, this.landSize - 2) * 700);
    }
    
    this.totalCost = poleCost + wireCost + labourCost;
    
    this.calculationDetails = {
      'Land Size': `${this.landSize} biswa`,
      'Perimeter': `${perimeter} feet`,
      'Regular Poles (every 10 ft)': `${regularPoles}`,
      'Corner Supports': `${cornerSupports}`,
      'Total Poles': `${totalPoles}`,
      'Pole Cost (@₹300 each)': `₹${poleCost.toLocaleString('en-IN')}`,
      'Barbed Wire Required': `${wireWeight.toFixed(2)} kg`,
      'Wire Cost (@₹110/kg)': `₹${wireCost.toLocaleString('en-IN')}`,
      'Labour & Installation': `₹${labourCost.toLocaleString('en-IN')}`,
      'Total Cost': `₹${this.totalCost.toLocaleString('en-IN')}`
    };
  }

  getPerimeter(biswa: number): number {
    // Use lookup table if available
    if (this.perimeterTable[biswa]) {
      return this.perimeterTable[biswa];
    }
    
    // For custom values, use formula: Perimeter (ft) ≈ 148 × √(biswa)
    return Math.round(148 * Math.sqrt(biswa));
  }

  resetCalculator() {
    this.landSize = 1;
    this.wallHeight = 6;
    this.customLandSize = false;
    this.showResults = false;
    this.totalCost = 0;
    this.calculationDetails = {};
    // reset manual inputs
    this.manualOption = 'boundary';
    this.manualBoundaryRate = 85;
    this.manualPolesCount = 0;
    this.manualPolePrice = 0;
    this.manualWireCost = 0;
  }

  sendWhatsAppQuote() {
    let message = '';
    if (this.calculationType === 'boundary' || (this.calculationType === 'manual' && this.manualOption === 'boundary')) {
      message = `Hi, I calculated a quote for Boundary Wall (Precast):\n\n`;
      message += `📏 Land Size: ${this.landSize} biswa\n`;
      message += `📐 Perimeter: ${this.getPerimeter(this.landSize)} feet\n`;
      message += `📊 Height: ${this.wallHeight} feet\n`;
      message += `💰 Estimated Cost: ₹${this.totalCost.toLocaleString('en-IN')}\n`;
      message += `\nPlease provide detailed quote and schedule site visit.`;
    } else if (this.calculationType === 'fencing' || (this.calculationType === 'manual' && this.manualOption === 'fencing')) {
      message = `Hi, I calculated a quote for Fencing (Barbed Wire):\n\n`;
      message += `📏 Land Size: ${this.landSize} biswa\n`;
      message += `📐 Perimeter: ${this.getPerimeter(this.landSize)} feet\n`;
      message += `🔨 Poles Required: ${this.calculationDetails['Total Poles'] || this.calculationDetails['Total Poles (user)'] || this.manualPolesCount}\n`;
      message += `💰 Estimated Cost: ₹${this.totalCost.toLocaleString('en-IN')}\n`;
      message += `\nPlease provide detailed quote and schedule site visit.`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/9346842755?text=${encodedMessage}`, '_blank');
  }

  scheduleVisit() {
    const productLabel = (this.calculationType === 'boundary' || (this.calculationType === 'manual' && this.manualOption === 'boundary')) ? '🏗️ Boundary Wall (Precast)' : '🚧 Fencing (Barbed Wire)';
    const message = `Hi, I would like to schedule a FREE site visit for:\n\n${productLabel}\n📏 Land Size: ${this.landSize} biswa\n\nPlease contact me to arrange a convenient time.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/9346842755?text=${encodedMessage}`, '_blank');
  }

  downloadQuote() {
    alert('📥 PDF Download feature - Coming Soon!\n\nFor now, please:\n✓ Screenshot this quote\n✓ Or send it via WhatsApp for detailed quotation');
  }
}

