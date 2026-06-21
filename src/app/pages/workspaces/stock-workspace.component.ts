import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DomainWorkspaceShellComponent } from '../../components/domain-workspace-shell/domain-workspace-shell.component';
import { InventoryViewComponent } from '../inventory-view/inventory-view.component';
import { MaterialPurchaseComponent } from '../material-purchase/material-purchase.component';
import { StockAuditComponent } from '../stock-audit/stock-audit.component';

@Component({
  selector: 'app-stock-workspace',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    DomainWorkspaceShellComponent,
    InventoryViewComponent,
    MaterialPurchaseComponent,
    StockAuditComponent
  ],
  templateUrl: './stock-workspace.component.html',
  styleUrls: ['./stock-workspace.component.css']
})
export class StockWorkspaceComponent {}
