import { inject, Injectable } from '@angular/core';
import { GridPosition } from '../../../classes/models/grid-position';
import { PixelPosition } from '../../../classes/models/pixel-position';
import { LoggerService } from '../../main-services/logger-service/logger.service';
import { RobotModel } from '../../../classes/models/robot-model/robot-model';

@Injectable({
  providedIn: 'root'
})
export abstract class RobotActionService<T extends RobotModel = RobotModel> {

  public serviceName = "";

  protected loggerService: LoggerService = inject(LoggerService);

  /**
   * Calcule de nouvelles directions selon l'intervale donnée
   */
  public abstract calculateNewDirectionsForAllRobots(): void;

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  public abstract calculatePixelCoordinates(grid: GridPosition): PixelPosition;
}
