import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-public-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './public-contact.component.html',
  styleUrls: ['./public-contact.component.css']
})
export class PublicContactComponent {
  fullName = '';
  mobile = '';
  email = '';
  subject = '';
  message = '';

  submitInquiry() {
    const text = [
      'New website inquiry',
      `Name: ${this.fullName || '-'}`,
      `Mobile: ${this.mobile || '-'}`,
      `Email: ${this.email || '-'}`,
      `Subject: ${this.subject || '-'}`,
      `Message: ${this.message || '-'}`
    ].join('\n');

    window.open(`https://wa.me/917052150626?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }
}
