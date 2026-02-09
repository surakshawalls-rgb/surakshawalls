import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class GoogleSheetService {

  private url = 'YOUR_NEW_WEB_APP_URL_HERE';

  constructor(private http: HttpClient) {}

  pushLabour(date: string, workers: any[]) {
    return this.http.post(this.url, {
      type: 'labour',
      date,
      workers
    });
  }
}
