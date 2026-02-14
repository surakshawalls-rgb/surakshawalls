import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* ================= MODELS ================= */

export interface LabourEntry {
  name: string;
  type: 'HALF' | 'FULL' | 'OUTDOOR' | 'CUSTOM';
  amount: number;
}

export interface DayRecord {
  date: string;
  production: {
    fencingPole: number;
    plainPlate: number;
    jumboPillar: number;
    roundPlate: number;
    biscuitPlate: number;
  };
  labour: LabourEntry[];
}

/* ================= SERVICE ================= */

@Injectable({ providedIn: 'root' })
export class DataService {
  private platformId = inject(PLATFORM_ID);

  getToday(date: string): DayRecord {
    const key = 'day_' + date;
    if (!isPlatformBrowser(this.platformId)) {
      return {
        date,
        production: { fencingPole: 0, plainPlate: 0, jumboPillar: 0, roundPlate: 0, biscuitPlate: 0 },
        labour: []
      };
    }
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);

    const blank: DayRecord = {
      date,
      production: {
        fencingPole: 0,
        plainPlate: 0,
        jumboPillar: 0,
        roundPlate: 0,
        biscuitPlate: 0
      },
      labour: []
    };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, JSON.stringify(blank));
    }
    return blank;
  }

  updateToday(day: DayRecord) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('day_' + day.date, JSON.stringify(day));
    }
  }
}
