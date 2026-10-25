import { inject, Injectable } from '@angular/core';
import { RobotActionService } from '../robot-action.service';
import { AlgoNettoyageService } from '../../robot-algos-deplacement-services/algo-nettoyage-service/algo-nettoyage.service';
import { Aspiroman } from '../../../../data-access/robot-data-access/robot.model';

@Injectable({
  providedIn: 'root'
})
export abstract class RobotActionAspiromanService extends RobotActionService<Aspiroman> {

  protected algoNettoyageService = inject(AlgoNettoyageService);

  constructor() {
    console.log("RobotActionAspiromanService - constructor()");
    super();
    this.serviceName = "RobotActionAspiromanService";
  }

  // TODO: revoir CSS de la maison si on affiche ces logs dans l'ihm
  /**
   * Méthode de logs(affichables)
   *
   * @param message
   */
  private log(message: string) {
    this.loggerService.add(`RobotActionAspiromanService: ${message} `);
  }
}
