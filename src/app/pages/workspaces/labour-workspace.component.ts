import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DomainWorkspaceShellComponent } from '../../components/domain-workspace-shell/domain-workspace-shell.component';
import { UnifiedDailyEntryComponent } from '../daily-entry/daily-entry';
import { LabourLedgerComponent } from '../labour-ledger/labour-ledger';
import { ReportsDashboardComponent } from '../reports-dashboard/reports-dashboard.component';

@Component({
  selector: 'app-labour-workspace',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    DomainWorkspaceShellComponent,
    LabourLedgerComponent,
    ReportsDashboardComponent,
    UnifiedDailyEntryComponent
  ],
  templateUrl: './labour-workspace.component.html',
  styleUrls: ['./labour-workspace.component.css']
})
export class LabourWorkspaceComponent {}
