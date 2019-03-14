import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

export interface OptionsModel {
  headers: HttpHeaders;
}

@Injectable({
  providedIn: 'root'
})
export class SidekickService {
  createHeaders(key: string, value: string): OptionsModel {
    return {
      headers: new HttpHeaders({
        key: value,
      }),
    };
  }
}
