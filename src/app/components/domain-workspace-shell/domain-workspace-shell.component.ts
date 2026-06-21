import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-domain-workspace-shell',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './domain-workspace-shell.component.html',
  styleUrls: ['./domain-workspace-shell.component.css']
})
export class DomainWorkspaceShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = 'dashboard';
}
