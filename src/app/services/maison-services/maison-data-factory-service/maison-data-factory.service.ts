import { inject, Injectable, Signal } from '@angular/core';
import { MaisonDataService } from '../maison-data-services/maison-data.service';
import { MaisonDataNettoyageService } from '../maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { MaisonModel } from '../../../classes/models/maison-model/maison-model';

@Injectable({
  providedIn: 'root',
})
export class MaisonDataFactoryService {

  private maisonDataService = inject(MaisonDataService);
  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  // Pattern factory: tableau de Maison Data Services de type spécifiques vers un type générique
  private maisonDataServiceTab: MaisonDataService[] = [this.maisonDataNettoyageService];

  /**
   * récupération du Signal des datas la maison pour le template
   * 
   * @returns 
   */
  public getMaisonSignal(): Signal<MaisonModel> {
    console.log("MaisonDataFactoryService - getMaisonSignal()");

    return this.maisonDataService.maisonSignal;
  }

  /**
   * Initialisation des datas de la maison
   */
  public setMaisonParams(): void {
    console.log("MaisonDataFactoryService - setMaisonParams()");

    for (let i = 0; i < this.maisonDataServiceTab.length; i++) {
      this.maisonDataNettoyageService.setMaisonParams();
    }
  }
}
