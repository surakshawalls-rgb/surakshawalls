import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface ServiceCategory {
  title: string;
  icon: string;
  offerings: string[];
}

interface ProductCard {
  name: string;
  price: string;
  specs: string;
  description: string;
  benefits: string[];
}

@Component({
  selector: 'app-suraksha-walls',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './suraksha-walls.component.html',
  styleUrls: ['./suraksha-walls.component.css']
})
export class SurakshaWallsComponent {
  readonly whatsAppOrderLink = 'https://api.whatsapp.com/send/?phone=919346842755&text&type=phone_number&app_absent=0';
  readonly officialWebsite = 'https://www.surakshawalls.shop';

  services: ServiceCategory[] = [
    {
      title: 'Precast Compound Walls',
      icon: 'home_work',
      offerings: ['Standard walls', 'Heavy-duty walls', 'Industrial walls']
    },
    {
      title: 'Designer Walls',
      icon: 'architecture',
      offerings: ['Stone finish options', 'Decorative patterns', 'Logo embedded designs']
    },
    {
      title: 'Security Add-ons',
      icon: 'gpp_good',
      offerings: ['Barbed wire', 'Chain link fencing', 'Solar or electric fencing', 'Smart gates']
    },
    {
      title: 'Precast Structures',
      icon: 'inventory_2',
      offerings: ['Guard rooms', 'Toilets', 'Benches', 'Flower pots and garden products']
    }
  ];

  whyChooseUs: string[] = [
    'Faster and stronger than brick walls',
    'Cost-effective and eco-friendly execution',
    'Trusted by farmers, builders, and industries',
    'Professional team with on-time delivery'
  ];

  products: ProductCard[] = [
    {
      name: 'RCC Fencing Poles (7.5 ft)',
      price: 'Rs 350 per pole',
      specs: '7.5 ft pole | Weather-resistant | Long life',
      description: 'Built for strength, durability, and secure boundaries. Easy to install and low maintenance for long-term use.',
      benefits: ['High durability', 'Low maintenance', 'Quick installation', 'Budget-friendly safety']
    },
    {
      name: 'RCC Fencing Poles (7 ft)',
      price: 'Rs 300 per pole',
      specs: '7 ft pole | Weather-resistant | Long life',
      description: 'Reliable fencing pole solution for farms, plots, and private boundaries where durability and value both matter.',
      benefits: ['Strong build quality', 'Long service life', 'Easy handling', 'Affordable pricing']
    },
    {
      name: 'Precast Boundary Wall',
      price: 'Rs 85 per sq. ft',
      specs: '5-10 ft height | 7 ft panels | 2 in thick',
      description: 'Strong and durable precast boundary walls designed for quick installation and long-term protection in residential and commercial properties.',
      benefits: ['Weather-resistant performance', 'Fast installation', 'Low maintenance', 'Customizable and eco-friendly design']
    },
    {
      name: 'Readymade Room',
      price: 'Rs 120 per sq. ft',
      specs: '5-10 ft height | 7 ft panels | 2 in thick',
      description: 'Precast readymade rooms for residential and commercial use with fast deployment and dependable structural quality.',
      benefits: ['Durable and weather-resistant', 'Fast installation', 'Low maintenance', 'Cost-effective and customizable']
    }
  ];
}
