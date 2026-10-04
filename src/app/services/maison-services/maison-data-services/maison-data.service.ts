import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CellStore } from '../../../maison.signal-store';
import { MaisonConfig } from '../../../classes/config/maison.config';

@Injectable({
  providedIn: 'root'
})
export abstract class MaisonDataService<T extends MaisonConfig = MaisonConfig> {

  protected httpClient = inject(HttpClient);

  protected cellStore = inject(CellStore);

  protected url = "http://localhost:4200";
  protected mockMaisonDatasPath = this.url + "";

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  /**
   * initialisation des datas de la Maison
   *
   * @returns
   */
  public abstract setMaisonParams(maisonConfig: MaisonConfig): void;

  /**
   * Renvoie les données mockées de la maison (fake database)
   */
  public abstract getJsonData(): Observable<T>;
}
