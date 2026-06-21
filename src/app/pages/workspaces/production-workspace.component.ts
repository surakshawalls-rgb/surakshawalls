import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DomainWorkspaceShellComponent } from '../../components/domain-workspace-shell/domain-workspace-shell.component';
import { ProductionComponent } from '../production/production';

@Component({
  selector: 'app-production-workspace',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    DomainWorkspaceShellComponent,
    ProductionComponent
  ],
  templateUrl: './production-workspace.component.html',
  styleUrls: ['./production-workspace.component.css']
})
export class ProductionWorkspaceComponent {}
