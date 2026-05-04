import { inject, Injectable, Signal } from '@angular/core';
import { MaisonDataService } from '../maison-data-services/maison-data.service';
import { MaisonDataNettoyageService } from '../maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { MaisonModel } from '../../../classes/models/maison-model/maison-model';

@Injectable({
  providedIn: 'root',
})
export class MaisonDataFactoryService {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  // Pattern factory: tableau de Maison Data Services de type spécifiques vers un type générique
  private maisonDataServicesTab: MaisonDataService[] = [this.maisonDataNettoyageService];

  public readonly maisonSignal: Signal<MaisonModel> = this.maisonDataNettoyageService.maisonSignal;

  /**
   * Initialisation des datas de la maison
   */
  public setMaisonParams(): void {
    console.log("MaisonDataFactoryService - setMaisonParams()");

    this.maisonDataServicesTab.forEach(maisonDataService => {
      maisonDataService.setMaisonParams();
    });
  }
}
