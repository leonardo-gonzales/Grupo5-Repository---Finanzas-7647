import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Servicio centralizado para leer los archivos .json locales en Etapa 1.
 * En Etapa 2 se reemplazará la URL base por los endpoints de la API REST.
 */
@Injectable({
    providedIn: 'root'
})
export class JsonDataService {
    private readonly http = inject(HttpClient);
    private readonly basePath = 'data';

    getData<T>(fileName: string): Observable<T> {
        return this.http.get<T>(`${this.basePath}/${fileName}.json`);
    }
}