import { Injectable } from '@angular/core';
import { Observable, defer } from 'rxjs';
import { operacionLocal } from './local-store';
@Injectable({ providedIn: 'root' })
export class JsonDataService {
  getData<T>(fileName: string): Observable<T> {
    return defer(() => operacionLocal<T>(`/data/${fileName}`));
  }
  guardarRegistro(file: string, id: number | null, value: unknown) {
    return operacionLocal(`/catalog/${file}${id ? '/' + id : ''}`, id ? 'PUT' : 'POST', value);
  }
  eliminarRegistro(file: string, id: number) {
    return operacionLocal(`/catalog/${file}/${id}`, 'DELETE');
  }
}
