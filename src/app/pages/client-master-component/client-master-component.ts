import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-master-component.html',
  styleUrl: './client-master-component.css'
})
export class ClientMasterComponent implements OnInit {

  constructor(private db: ClientService, private cd: ChangeDetectorRef) {}

  language: 'EN' | 'HI' = 'EN';
  toggleLang() { this.language = this.language === 'EN' ? 'HI' : 'EN'; }

  clientName = '';
  siteName = '';

  clients: any[] = [];
  loading = false;
  editId: string | null = null;

  async ngOnInit() {
    await this.loadClients();
  }

  private startLoading() {
    this.loading = true;
    this.cd.detectChanges();
  }

  private stopLoading() {
    this.loading = false;
    this.cd.detectChanges();
  }

  async saveClient() {
    if (!this.clientName) return alert("Enter client name");

    this.startLoading();

    let res: any;
    if (this.editId) {
      res = await this.db.updateClient(this.editId, {
        client_name: this.clientName,
        address: this.siteName
      });
    } else {
      res = await this.db.addClient({
        client_name: this.clientName,
        address: this.siteName
      });
    }

    this.stopLoading();

    if (!res.success) {
      console.error(res.error);
      return alert("❌ Error: " + (res.error || 'Failed to save client'));
    }

    alert("✅ Saved");
    this.clientName = '';
    this.siteName = '';
    this.editId = null;
    await this.loadClients();
  }

  editClient(c: any) {
    this.editId = c.id;
    this.clientName = c.client_name;
    this.siteName = c.site_name;
  }

  async loadClients() {
    this.startLoading();
    const res = await this.db.getAllClients();
    this.clients = res || [];
    this.stopLoading();
  }
}
