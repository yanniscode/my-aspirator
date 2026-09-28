import { inject, Injectable } from '@angular/core';

import { CellElement } from '../../../classes/models/cell-element';
import { GridPosition } from '../../../classes/models/grid-position';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CellStore } from '../../../maison.signal-store';
import { CellsStateModel } from '../../../classes/models/maison-model/maison.model';

@Injectable({
  providedIn: 'root'
})
export abstract class MaisonDataService<T extends CellsStateModel = CellsStateModel> {

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
  public abstract setMaisonParams(maisonModel: CellsStateModel): void;

  /**
   * Renvoie les données mockées de la maison (fake database)
   */
  public abstract getJsonData(): Observable<T>;
}
