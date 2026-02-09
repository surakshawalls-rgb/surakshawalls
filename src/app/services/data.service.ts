import { Injectable } from '@angular/core';

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

  getToday(date: string): DayRecord {
    const key = 'day_' + date;
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

    localStorage.setItem(key, JSON.stringify(blank));
    return blank;
  }

  updateToday(day: DayRecord) {
    localStorage.setItem('day_' + day.date, JSON.stringify(day));
  }
}
