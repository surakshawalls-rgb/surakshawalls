import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../../services/production.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

export type ProductionKey =
  | 'fencingPole'
  | 'plainPlate'
  | 'jumboPillar'
  | 'roundPlate'
  | 'biscuitPlate';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './production.html',
  styleUrls: ['./production.css']
})
export class ProductionComponent implements OnInit {

  constructor(private db: ProductionService, private cd: ChangeDetectorRef) {}

  // Tabs
  activeTab: 'production' | 'selling' | 'damage' = 'production';

  language: 'EN' | 'HI' = 'EN';
  toggleLang() { this.language = this.language === 'EN' ? 'HI' : 'EN'; }

  date = new Date().toISOString().split('T')[0];
  sellingDate = new Date().toISOString().split('T')[0];
  damageDate = new Date().toISOString().split('T')[0];
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;

  // Production Tab
  production: Record<ProductionKey, number> = {
    fencingPole: 0,
    plainPlate: 0,
    jumboPillar: 0,
    roundPlate: 0,
    biscuitPlate: 0
  };

  // Selling Tab
  sellingClient: string = '';
  sellingItem: ProductionKey = 'fencingPole';
  sellingQuantity: number | null = null;
  sellingPrice: number | null = null;

  // Damage Tab
  damageItem: ProductionKey = 'fencingPole';
  damageQuantity: number | null = null;
  damageReason: string = '';

  items = [
    { key: 'fencingPole', labelEN: 'Fencing Pole', labelHI: 'फेंसिंग पोल' },
    { key: 'plainPlate', labelEN: 'Plain Plate', labelHI: 'सादा प्लेट' },
    { key: 'jumboPillar', labelEN: 'Jumbo Pillar', labelHI: 'जंबो पिलर' },
    { key: 'roundPlate', labelEN: 'Round Plate', labelHI: 'राउंड प्लेट' },
    { key: 'biscuitPlate', labelEN: 'Biscuit Plate', labelHI: 'बिस्किट प्लेट' }
  ] as const;

  records: any[] = [];
  sellingRecords: any[] = [];
  damageRecords: any[] = [];
  filtered: any[] = [];

  page = 0;
  pageSize = 10;
  filterDate = '';

  loading = false;
  loadingTimeout: any;

  async ngOnInit() {
    console.log('[ProductionComponent] ngOnInit');
    await this.loadTable();
    await this.loadSelling();
    await this.loadDamage();
  }

  inc(key: ProductionKey) { this.production[key]++; }
  dec(key: ProductionKey) { if (this.production[key] > 0) this.production[key]--; }

  // 🔥 SAFE LOADER WRAPPER
  private startLoading() {
    this.loading = true;
    this.cd.detectChanges();

    // SAFETY TIMEOUT (10 sec)
    this.loadingTimeout = setTimeout(() => {
      this.loading = false;
      this.cd.detectChanges();
      console.warn("Loading auto-stopped (timeout)");
    }, 10000);
  }

  private stopLoading() {
    clearTimeout(this.loadingTimeout);
    this.loading = false;
    this.cd.detectChanges();
  }

  // 💾 SAVE
  async saveProduction() {
    this.startLoading();

    try {
      const payload = {
        date: this.date,
        fencing_pole: this.production.fencingPole,
        plain_plate: this.production.plainPlate,
        jumbo_pillar: this.production.jumboPillar,
        round_plate: this.production.roundPlate,
        biscuit_plate: this.production.biscuitPlate
      };

      console.log('[ProductionComponent] saveProduction payload ->', payload);
      const res = await this.db.saveProductionLegacy(payload);
      console.log('[ProductionComponent] saveProduction res ->', res);

      if (res.error) {
        console.error('[ProductionComponent] saveProduction error ->', res.error);
        alert("❌ Save Failed");
        return;
      }

      alert("✅ Production Saved");
      await this.loadTable(); // AUTO REFRESH
    }
    finally {
      this.stopLoading();
    }
  }

  // 📊 LOAD TABLE
  async loadTable() {
    this.startLoading();

    try {
      const from = this.page * this.pageSize;
      const to = from + this.pageSize - 1;

      const res = await this.db.getProductionLegacy(from, to);

      console.log('[ProductionComponent] loadTable res ->', res);
      this.records = res.data || [];
      this.filtered = [...this.records];
    }
    catch (err) {
      console.error('[ProductionComponent] Load error', err);
    }
    finally {
      this.stopLoading();
    }
  }

  // FILTER DATE
  async applyFilter() {
    this.startLoading();

    try {
      if (!this.filterDate) {
        this.filtered = [...this.records];
        return;
      }

      console.log('[ProductionComponent] applyFilter date ->', this.filterDate);
      const res = await this.db.filterByDateLegacy(this.filterDate);
      console.log('[ProductionComponent] applyFilter res ->', res);
      this.filtered = res.data || [];
    }
    finally {
      this.stopLoading();
    }
  }

  // Pagination
  async nextPage() {
    this.page++;
    await this.loadTable();
  }

  async prevPage() {
    if (this.page > 0) {
      this.page--;
      await this.loadTable();
    }
  }

  refreshTable() {
    this.loadTable();
  }

  // 🗑️ DELETE FUNCTIONS
  async deleteProduction(id: number) {
    if (!confirm('Are you sure you want to delete this production record?')) return;

    this.startLoading();
    try {
      console.log('[ProductionComponent] deleteProduction id ->', id);
      const res = await this.db.deleteProductionLegacy(id);
      console.log('[ProductionComponent] deleteProduction res ->', res);
      if (res.error) {
        console.error('[ProductionComponent] deleteProduction error ->', res.error);
        alert("❌ Delete Failed");
        return;
      }
      alert("✅ Production Record Deleted");
      await this.loadTable();
    }
    finally {
      this.stopLoading();
    }
  }

  async deleteSelling(id: number) {
    if (!confirm('Are you sure you want to delete this sale?')) return;

    this.startLoading();
    try {
      console.log('[ProductionComponent] deleteSelling id ->', id);
      const res = await this.db.deleteSelling(id);
      console.log('[ProductionComponent] deleteSelling res ->', res);
      if (res.error) {
        console.error('[ProductionComponent] deleteSelling error ->', res.error);
        alert("❌ Delete Failed");
        return;
      }
      alert("✅ Sale Record Deleted");
      await this.loadSelling();
    }
    finally {
      this.stopLoading();
    }
  }

  async deleteDamage(id: number) {
    if (!confirm('Are you sure you want to delete this damage record?')) return;

    this.startLoading();
    try {
      console.log('[ProductionComponent] deleteDamage id ->', id);
      const res = await this.db.deleteDamage(id);
      console.log('[ProductionComponent] deleteDamage res ->', res);
      if (res.error) {
        console.error('[ProductionComponent] deleteDamage error ->', res.error);
        alert("❌ Delete Failed");
        return;
      }
      alert("✅ Damage Record Deleted");
      await this.loadDamage();
    }
    finally {
      this.stopLoading();
    }
  }

  // WhatsApp
  generateMessage() {
    let msg = `🏭 Production Report\nDate: ${this.date}\n\n`;
    this.items.forEach(i => msg += `${i.labelEN}: ${this.production[i.key]}\n`);
    return msg;
  }

  sendWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(this.generateMessage())}`, '_blank');
  }

  // 💰 SAVE SELLING
  async saveSelling() {
    if (!this.sellingClient || !this.sellingQuantity || !this.sellingPrice) {
      alert("❌ Fill all fields");
      return;
    }

    this.startLoading();

    try {
      const payload = {
        date: this.sellingDate,
        client: this.sellingClient,
        item: this.sellingItem,
        quantity: this.sellingQuantity,
        price: this.sellingPrice
      };

      console.log('[ProductionComponent] saveSelling payload ->', payload);
      const res = await this.db.saveSelling(payload);
      console.log('[ProductionComponent] saveSelling res ->', res);

      if (res.error) {
        console.error('[ProductionComponent] saveSelling error ->', res.error);
        alert("❌ Save Failed");
        return;
      }

      alert("✅ Sale Recorded");
      this.sellingClient = '';
      this.sellingQuantity = null;
      this.sellingPrice = null;
      await this.loadSelling();
    }
    finally {
      this.stopLoading();
    }
  }

  // 📊 LOAD SELLING
  async loadSelling() {
    this.startLoading();

    try {
      const res = await this.db.getSelling();
      console.log('[ProductionComponent] loadSelling res ->', res);
      this.sellingRecords = res.data || [];
    }
    catch (err) {
      console.error('[ProductionComponent] Load selling error', err);
    }
    finally {
      this.stopLoading();
    }
  }

  // ⚠️ SAVE DAMAGE
  async saveDamage() {
    if (!this.damageQuantity || !this.damageReason) {
      alert("❌ Fill all fields");
      return;
    }

    this.startLoading();

    try {
      const payload = {
        date: this.damageDate,
        item: this.damageItem,
        quantity: this.damageQuantity,
        reason: this.damageReason
      };

      console.log('[ProductionComponent] saveDamage payload ->', payload);
      const res = await this.db.saveDamage(payload);
      console.log('[ProductionComponent] saveDamage res ->', res);

      if (res.error) {
        console.error('[ProductionComponent] saveDamage error ->', res.error);
        alert("❌ Save Failed");
        return;
      }

      alert("⚠️ Damage Recorded");
      this.damageQuantity = null;
      this.damageReason = '';
      await this.loadDamage();
    }
    finally {
      this.stopLoading();
    }
  }

  // 📊 LOAD DAMAGE
  async loadDamage() {
    this.startLoading();

    try {
      const res = await this.db.getDamage();
      console.log('[ProductionComponent] loadDamage res ->', res);
      this.damageRecords = res.data || [];
    }
    catch (err) {
      console.error('[ProductionComponent] Load damage error', err);
    }
    finally {
      this.stopLoading();
    }
  }
}

