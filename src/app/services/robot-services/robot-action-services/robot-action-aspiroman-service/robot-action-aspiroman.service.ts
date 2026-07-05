import { inject, Injectable } from '@angular/core';
import { GridPosition } from '../../../../classes/models/grid-position';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { RobotActionService } from '../robot-action.service';
import { AlgoNettoyageService } from '../../robot-algos-deplacement-services/algo-nettoyage-service/algo-nettoyage.service';
import { AspiromanModel } from '../../../../classes/models/robot-model/aspiroman-model/aspiroman-model';

@Injectable({
  providedIn: 'root'
})
export abstract class RobotActionAspiromanService extends RobotActionService<AspiromanModel> {

  protected algoNettoyageService = inject(AlgoNettoyageService);

  // Configuration de l'animation
  private PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  constructor() {
    console.log("RobotActionAspiromanService - constructor()");
    super();
    this.serviceName = "RobotActionAspiromanService";
    this.PIXELS_PER_STEP = 50;
  }

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  public override calculatePixelCoordinates(grid: GridPosition): PixelPosition {
    // console.log("RobotActionAspiromanService - calculatePixelCoordinates()");

    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
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
