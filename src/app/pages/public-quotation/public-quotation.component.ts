import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';

interface LandSize {
  label: string;
  biswa: number;
  displayText: string;
}

interface FieldEntry {
  id: number;
  biswa?: number;
  perimeterFeet?: number;
  displayText: string;
  measurementType: 'area' | 'perimeter';
}

interface QuotationResult {
  productType: string;
  fields: FieldEntry[];
  totalBiswa: number;
  totalArea: number;
  perimeter: number;
  perimeterFeet: number;
  wallHeight?: number;
  wallArea?: number;
  // Boundary Wall
  wallRate?: number;
  wallCost?: number;
  // Barbed Wire Fencing
  poles?: number;
  poleRate?: number;
  poleCost?: number;
  wireWeight?: number;
  wireRate?: number;
  wireCost?: number;
  labourDays?: number;
  labourRate?: number;
  labourCost?: number;
  // Total
  materialCost: number;
  totalCost: number;
}

@Component({
  selector: 'app-public-quotation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './public-quotation.component.html',
  styleUrls: ['./public-quotation.component.css']
})
export class PublicQuotationComponent {
  // Form inputs
  productType: 'boundary-wall' | 'barbed-fencing' = 'boundary-wall';
  measurementType: 'area' | 'perimeter' = 'area';
  presetLandSize: string = '1-biswa';
  customPerimeter: number | null = null;
  wallHeight: number = 6; // Default 6 feet
  
  // Multiple fields support
  fields: FieldEntry[] = [];
  nextFieldId = 1;
  
  // Wall height options (for boundary wall only)
  wallHeights: number[] = [4, 5, 6, 7, 8, 9, 10];
  
  // Calculation result
  quotation: QuotationResult | null = null;
  
  // Constants (UP Bhadohi)
  readonly BISWA_TO_SQFT = 1350; // 1 Biswa ≈ 1350 sq ft
  readonly BISWA_PER_BIGHA = 20;
  
  // Rates
  readonly BOUNDARY_WALL_RATE = 85; // per sq ft
  readonly POLE_RATE = 300; // per piece
  readonly POLE_DISTANCE = 10; // feet between poles
  readonly WIRE_PER_10FT = 1; // kg for 3 rows
  readonly WIRE_RATE = 105; // per kg (updated rate)
  readonly LABOUR_RATE = 500; // per day
  
  // Preset land sizes (1 to 20 biswa + bigha options)
  landSizes: LandSize[] = [
    { label: '1-biswa', biswa: 1, displayText: '1 Biswa (~1,350 sq ft)' },
    { label: '2-biswa', biswa: 2, displayText: '2 Biswa (~2,700 sq ft)' },
    { label: '3-biswa', biswa: 3, displayText: '3 Biswa (~4,050 sq ft)' },
    { label: '4-biswa', biswa: 4, displayText: '4 Biswa (~5,400 sq ft)' },
    { label: '5-biswa', biswa: 5, displayText: '5 Biswa (~6,750 sq ft)' },
    { label: '6-biswa', biswa: 6, displayText: '6 Biswa (~8,100 sq ft)' },
    { label: '7-biswa', biswa: 7, displayText: '7 Biswa (~9,450 sq ft)' },
    { label: '8-biswa', biswa: 8, displayText: '8 Biswa (~10,800 sq ft)' },
    { label: '9-biswa', biswa: 9, displayText: '9 Biswa (~12,150 sq ft)' },
    { label: '10-biswa', biswa: 10, displayText: '10 Biswa (~13,500 sq ft)' },
    { label: '11-biswa', biswa: 11, displayText: '11 Biswa (~14,850 sq ft)' },
    { label: '12-biswa', biswa: 12, displayText: '12 Biswa (~16,200 sq ft)' },
    { label: '13-biswa', biswa: 13, displayText: '13 Biswa (~17,550 sq ft)' },
    { label: '14-biswa', biswa: 14, displayText: '14 Biswa (~18,900 sq ft)' },
    { label: '15-biswa', biswa: 15, displayText: '15 Biswa (~20,250 sq ft)' },
    { label: '16-biswa', biswa: 16, displayText: '16 Biswa (~21,600 sq ft)' },
    { label: '17-biswa', biswa: 17, displayText: '17 Biswa (~22,950 sq ft)' },
    { label: '18-biswa', biswa: 18, displayText: '18 Biswa (~24,300 sq ft)' },
    { label: '19-biswa', biswa: 19, displayText: '19 Biswa (~25,650 sq ft)' },
    { label: '20-biswa', biswa: 20, displayText: '20 Biswa (1 Bigha)' },
    { label: '1.5-bigha', biswa: 30, displayText: '1.5 Bigha (30 Biswa)' },
    { label: '2-bigha', biswa: 40, displayText: '2 Bigha (40 Biswa)' },
    { label: '2.5-bigha', biswa: 50, displayText: '2.5 Bigha (50 Biswa)' },
    { label: '3-bigha', biswa: 60, displayText: '3 Bigha (60 Biswa)' },
    { label: '3.5-bigha', biswa: 70, displayText: '3.5 Bigha (70 Biswa)' },
    { label: '4-bigha', biswa: 80, displayText: '4 Bigha (80 Biswa)' }
  ];

  constructor(private router: Router) {}

  addField() {
    if (this.measurementType === 'area') {
      const selectedSize = this.landSizes.find(size => size.label === this.presetLandSize);
      if (selectedSize) {
        this.fields.push({
          id: this.nextFieldId++,
          biswa: selectedSize.biswa,
          displayText: selectedSize.displayText,
          measurementType: 'area'
        });
        this.quotation = null;
      }
    } else {
      // Direct perimeter input
      if (this.customPerimeter && this.customPerimeter > 0) {
        this.fields.push({
          id: this.nextFieldId++,
          perimeterFeet: this.customPerimeter,
          displayText: `${this.customPerimeter} Running Feet`,
          measurementType: 'perimeter'
        });
        this.customPerimeter = null; // Reset input
        this.quotation = null;
      } else {
        alert('Please enter running feet/perimeter');
      }
    }
  }

  removeField(id: number) {
    this.fields = this.fields.filter(f => f.id !== id);
    this.quotation = null;
  }

  getTotalBiswa(): number {
    return this.fields
      .filter(f => f.biswa !== undefined)
      .reduce((sum, field) => sum + (field.biswa || 0), 0);
  }
  
  getTotalPerimeter(): number {
    return this.fields
      .filter(f => f.perimeterFeet !== undefined)
      .reduce((sum, field) => sum + (field.perimeterFeet || 0), 0);
  }

  calculateQuotation() {
    if (this.fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    // Calculate total area and perimeter
    const totalBiswa = this.getTotalBiswa();
    const totalAreaSqFt = totalBiswa * this.BISWA_TO_SQFT;
    
    // Calculate total perimeter from both area-based and direct perimeter fields
    let totalPerimeterFeet = 0;
    
    // Add perimeter from area-based fields (assuming square)
    this.fields.forEach(field => {
      if (field.measurementType === 'area' && field.biswa) {
        const areaSqFt = field.biswa * this.BISWA_TO_SQFT;
        const side = Math.sqrt(areaSqFt);
        const perimeterFeet = 4 * side;
        totalPerimeterFeet += perimeterFeet;
      } else if (field.measurementType === 'perimeter' && field.perimeterFeet) {
        totalPerimeterFeet += field.perimeterFeet;
      }
    });
    
    const totalPerimeterMeters = totalPerimeterFeet * 0.3048;

    if (this.productType === 'boundary-wall') {
      // Boundary Wall Calculation (use selected wall height)
      const wallAreaSqFt = totalPerimeterFeet * this.wallHeight;
      const wallCost = Math.round(wallAreaSqFt * this.BOUNDARY_WALL_RATE);

      this.quotation = {
        productType: 'Precast Boundary Wall',
        fields: [...this.fields],
        totalBiswa: totalBiswa,
        totalArea: Math.round(totalAreaSqFt),
        perimeter: Math.round(totalPerimeterMeters * 10) / 10,
        perimeterFeet: Math.round(totalPerimeterFeet),
        wallHeight: this.wallHeight,
        wallArea: Math.round(wallAreaSqFt),
        wallRate: this.BOUNDARY_WALL_RATE,
        wallCost: wallCost,
        materialCost: wallCost,
        totalCost: wallCost
      };
    } else {
      // Barbed Wire Fencing Calculation
      const numberOfPoles = Math.ceil(totalPerimeterFeet / this.POLE_DISTANCE) + this.fields.length;
      const poleCost = numberOfPoles * this.POLE_RATE;
      
      const wireSegments = Math.ceil(totalPerimeterFeet / this.POLE_DISTANCE);
      const wireWeight = wireSegments * this.WIRE_PER_10FT;
      const wireCost = Math.round(wireWeight * this.WIRE_RATE);
      
      // Labour: Assume 1 day per 100 feet
      const labourDays = Math.ceil(totalPerimeterFeet / 100);
      const labourCost = labourDays * this.LABOUR_RATE;
      
      const materialCost = poleCost + wireCost;
      const totalCost = materialCost + labourCost;

      this.quotation = {
        productType: 'Barbed Wire Fencing',
        fields: [...this.fields],
        totalBiswa: totalBiswa,
        totalArea: Math.round(totalAreaSqFt),
        perimeter: Math.round(totalPerimeterMeters * 10) / 10,
        perimeterFeet: Math.round(totalPerimeterFeet),
        poles: numberOfPoles,
        poleRate: this.POLE_RATE,
        poleCost: poleCost,
        wireWeight: Math.round(wireWeight * 10) / 10,
        wireRate: this.WIRE_RATE,
        wireCost: wireCost,
        labourDays: labourDays,
        labourRate: this.LABOUR_RATE,
        labourCost: labourCost,
        materialCost: materialCost,
        totalCost: totalCost
      };
    }
  }

  generatePDF() {
    if (!this.quotation) {
      alert('Please calculate quotation first');
      return;
    }

    // Create a new window with printable quotation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download PDF');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-IN');
    const quotationNumber = `SW-${Date.now().toString().slice(-8)}`;

    // Field details HTML
    const fieldDetailsHTML = this.quotation.fields.map((field, idx) => 
      `<div style="margin: 4px 0;"><strong>Field ${idx + 1}:</strong> ${field.displayText}</div>`
    ).join('');

    let itemsRows = '';
    
    if (this.productType === 'boundary-wall') {
      itemsRows = `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">1</td>
          <td style="padding: 12px; border: 1px solid #ddd;">Precast Boundary Wall (${this.quotation.wallHeight || this.wallHeight} ft height)</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${this.quotation.wallArea} sq ft</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₹${this.quotation.wallRate}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${this.quotation.wallCost?.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Material + Labour + Transportation</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${this.quotation.materialCost.toLocaleString('en-IN')}</td>
        </tr>
      `;
    } else {
      itemsRows = `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">1</td>
          <td style="padding: 12px; border: 1px solid #ddd;">RCC Fencing Poles (10 ft spacing)</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${this.quotation.poles} pieces</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₹${this.quotation.poleRate}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₹${this.quotation.poleCost?.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">2</td>
          <td style="padding: 12px; border: 1px solid #ddd;">Barbed Wire (3 rows)</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${this.quotation.wireWeight} kg</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₹${this.quotation.wireRate}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₹${this.quotation.wireCost?.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Material Cost</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${this.quotation.materialCost.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">3</td>
          <td style="padding: 12px; border: 1px solid #ddd;">Labour Charges</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${this.quotation.labourDays} days</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₹${this.quotation.labourRate}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₹${this.quotation.labourCost?.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation - ${quotationNumber}</title>
        <style>
          @media print {
            @page { margin: 0.5cm; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
            color: #333;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .brand-logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .brand-tagline {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .contact-info {
            background: rgba(255,255,255,0.15);
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 13px;
          }
          .quotation-details {
            border: 1px solid #ddd;
            border-top: none;
            padding: 20px;
            background: #f9fafb;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: white;
            border-radius: 4px;
            border-left: 3px solid #3b82f6;
          }
          .detail-label {
            font-weight: 600;
            color: #666;
          }
          .detail-value {
            color: #1e3a8a;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
          }
          th {
            background: #1e3a8a;
            color: white;
            padding: 12px;
            text-align: left;
            border: 1px solid #1e3a8a;
          }
          .total-section {
            background: #f0f9ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
          }
          .grand-total {
            border-top: 2px solid #1e3a8a;
            padding-top: 12px;
            margin-top: 12px;
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
          }
          .terms {
            margin-top: 30px;
            padding: 20px;
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
          }
          .terms h3 {
            color: #92400e;
            margin-top: 0;
          }
          .terms ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .terms li {
            margin: 5px 0;
            color: #78350f;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            background: #f9fafb;
            border-top: 3px solid #3b82f6;
            border-radius: 0 0 8px 8px;
          }
          .site-layout {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .site-layout h4 {
            margin-top: 0;
            color: #1e3a8a;
          }
          .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-logo">🛡️ SURAKSHA WALLS</div>
          <div class="brand-tagline">Precast Boundary Wall | RCC Walls & Fencing Experts in Bhadohi</div>
          <div class="contact-info">
            <div>📱 <strong>8090272727</strong> | <strong>9506629814</strong></div>
            <div>🌐 www.surakshawalls.shop | www.surakshawalls.space</div>
            <div>📍 Mahajuda, Bhadohi, Uttar Pradesh - 221404</div>
          </div>
        </div>

        <div class="quotation-details">
          <h2 style="margin-top: 0; color: #1e3a8a;">QUOTATION</h2>
          
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Quotation No:</span>
              <span class="detail-value">${quotationNumber}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${currentDate}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Product Type:</span>
              <span class="detail-value">${this.quotation.productType}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Total Perimeter:</span>
              <span class="detail-value">${this.quotation.perimeterFeet} feet (${this.quotation.perimeter} m)</span>
            </div>
          </div>

<div class="site-layout">
            <h4>📋 Field Details</h4>
            <div style="padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              ${fieldDetailsHTML}
              <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #3b82f6;">
                <strong>Total Perimeter (All Fields):</strong> <span class="highlight">${this.quotation.perimeterFeet} feet</span> (${this.quotation.perimeter} meters)
              </div>
            </div>
          </div>

          <div class="site-layout">
            <h4>📏 ${this.productType === 'boundary-wall' ? 'Wall Specifications' : 'Fencing Specifications'}</h4>
          <div class="site-layout">
            <h4>📏 ${this.productType === 'boundary-wall' ? 'Wall Specifications' : 'Fencing Specifications'}</h4>
            <div style="display: flex; gap: 30px; align-items: center;">
              <div style="flex: 1;">
                <div style="padding: 15px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  ${this.productType === 'boundary-wall' 
                    ? `<div style="margin: 8px 0;"><strong>Wall Height:</strong> ${this.quotation.wallHeight || this.wallHeight} feet</div>
                       <div style="margin: 8px 0;"><strong>Wall Area:</strong> <span class="highlight">${this.quotation.wallArea} sq ft</span></div>
                       <div style="margin: 8px 0;"><strong>Rate:</strong> ₹${this.quotation.wallRate}/sq ft</div>`
                    : `<div style="margin: 8px 0;"><strong>Poles Required:</strong> <span class="highlight">${this.quotation.poles} pieces</span></div>
                       <div style="margin: 8px 0;"><strong>Pole Spacing:</strong> 10 feet</div>
                       <div style="margin: 8px 0;"><strong>Wire Required:</strong> ${this.quotation.wireWeight} kg (3 rows)</div>`
                  }
                </div>
              </div>
            </div>
          </div>

          <h3 style="color: #1e3a8a; margin-top: 25px;">Itemized Cost Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">S.No</th>
                <th>Description</th>
                <th style="width: 120px; text-align: center;">Quantity</th>
                <th style="width: 120px; text-align: right;">Rate</th>
                <th style="width: 150px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="total-section">
            ${this.productType === 'barbed-fencing' ? `
            <div class="total-row">
              <span>Material Cost:</span>
              <span><strong>₹${this.quotation.materialCost.toLocaleString('en-IN')}</strong></span>
            </div>
            <div class="total-row">
              <span>Labour Charges:</span>
              <span><strong>₹${this.quotation.labourCost?.toLocaleString('en-IN')}</strong></span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TOTAL ESTIMATED COST:</span>
              <span>₹${this.quotation.totalCost.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0; display: flex; align-items: center; gap: 8px;">
              ⚠️ Important Disclaimer
            </h3>
            <p style="color: #78350f; margin: 8px 0; line-height: 1.6;">
              <strong>Note:</strong> This quotation is an approximate estimate based on the information provided. 
              <strong>Final prices may vary</strong> at the time of installation depending on:
            </p>
            <ul style="color: #78350f; margin: 8px 0; padding-left: 20px;">
              <li>Actual site conditions and measurements</li>
              <li>Distance from manufacturing unit</li>
              <li>Site accessibility and terrain</li>
              <li>Current market rates of materials</li>
              <li>Any special requirements or modifications</li>
            </ul>
            <p style="color: #78350f; margin: 8px 0; line-height: 1.6;">
              <strong>For accurate pricing,</strong> we recommend a site visit and detailed measurement. 
              Please contact us at <strong>8090272727</strong> or <strong>9506629814</strong> to schedule a visit.
            </p>
          </div>

          <div class="terms">
            <h3>📋 Terms & Conditions:</h3>
            <ul>
              ${this.productType === 'boundary-wall' 
                ? `<li><strong>Rate includes:</strong> Material, Installation, Labour, and Transportation</li>
                   <li><strong>Material:</strong> High-quality RCC precast boundary wall panels with steel reinforcement</li>
                   <li><strong>Installation:</strong> Professional installation by experienced team</li>
                   <li><strong>Warranty:</strong> 2 years on manufacturing defects</li>`
                : `<li><strong>Material Cost:</strong> RCC Fencing Poles and Barbed Wire (as itemized above)</li>
                   <li><strong>Labour Charges:</strong> ₹${this.quotation.labourRate}/day charged separately (estimated ${this.quotation.labourDays} days)</li>
                   <li><strong>Installation:</strong> Includes pole setting, wire stretching, and 3-row barbed wire</li>
                   <li><strong>Wire Quality:</strong> High-tensile galvanized barbed wire</li>`
              }
              <li><strong>Payment:</strong> 50% advance, balance on completion</li>
              <li><strong>Timeline:</strong> Completion within 7-10 working days from advance payment</li>
              <li><strong>Validity:</strong> This quotation is valid for 30 days from date of issue</li>
              <li><strong>Site Access:</strong> Clear site access required for installation</li>
              <li><strong>Variations:</strong> Actual cost may vary based on site conditions and exact measurements</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #1e3a8a;">Thank you for considering Suraksha Walls!</p>
          <p style="margin: 5px 0; color: #666;">For any queries or site visit, please contact: <strong>8090272727</strong> | <strong>9506629814</strong></p>
          <p style="margin: 15px 0 5px 0; font-size: 12px; color: #999;">This is a computer-generated quotation and does not require signature.</p>
          <p style="margin: 5px 0; font-size: 12px; color: #999;">Suraksha Walls - Your Trusted Partner for Boundary Solutions in Bhadohi</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  scrollToCalculator() {
    const element = document.getElementById('calculator-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  }
}
