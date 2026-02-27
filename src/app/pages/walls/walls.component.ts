import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

interface Product {
  name: string;
  price: string;
  description: string;
  features: string[];
  image?: string;
}

@Component({
  selector: 'app-walls',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatTabsModule],
  templateUrl: './walls.component.html',
  styleUrls: ['./walls.component.css']
})
export class WallsComponent {
  
  products: Product[] = [
    {
      name: 'Precast Boundary Walls',
      price: '₹85 per sq. ft',
      description: 'Strong and durable precast boundary walls designed for quick installation and long-term protection.',
      features: [
        'Height: 4-10 ft',
        '7 ft wide panels',
        '2 inch thickness',
        'Fast installation',
        'Weather-resistant',
        'Low maintenance',
        '1 Year warranty'
      ]
    },
    {
      name: 'RCC Fencing Poles (7.5 ft)',
      price: '₹350 per pole',
      description: 'Premium 7.5 ft RCC fencing poles built for strength, durability, and long life.',
      features: [
        'Height: 7.5 ft',
        'Weather-resistant',
        'Low maintenance',
        'Easy installation',
        'Long-lasting',
        'Perfect for boundaries'
      ]
    },
    {
      name: 'RCC Fencing Poles (7 ft)',
      price: '₹300 per pole',
      description: 'Standard 7 ft RCC fencing poles ideal for secure property boundaries.',
      features: [
        'Height: 7 ft',
        'Durable construction',
        'Weather-resistant',
        'Cost-effective',
        'Easy to install',
        'Ideal for farms'
      ]
    },
    {
      name: 'Readymade Rooms',
      price: '₹120 per sq. ft',
      description: 'Precast readymade rooms built for strength, durability, and fast installation.',
      features: [
        'Height: 5-10 ft',
        'Quick installation',
        'Durable & strong',
        'Customizable',
        'Eco-friendly',
        'Cost-effective'
      ]
    }
  ];

  constructor(private router: Router) {}

  navigateToQuotation() {
    this.router.navigate(['/walls/quotation']);
  }

  contactWhatsApp() {
    window.open('https://wa.me/9346842755?text=Hi, I am interested in Suraksha Walls products', '_blank');
  }

  callNow() {
    window.location.href = 'tel:9346842755';
  }
}
