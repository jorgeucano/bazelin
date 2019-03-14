import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UserList } from '../library-deps/user-list.model';
import { SidekickService } from './sidekick-service/sidekick.service';

@Injectable({
  providedIn: 'root'
})
export class MainService {
  private URL = 'https://some.url.com/search';

  constructor(
    private http: HttpClient,
    private sidekickService: SidekickService
  ) { }

  getUsersList(searchValue: string): Observable<UserList> {
    const requestOptions = this.sidekickService.createHeaders('Content-Type', 'application/json');

    return this.http.get<UserList>(this.URL, requestOptions);
  }
}
