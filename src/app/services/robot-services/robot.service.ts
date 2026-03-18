import { inject, Injectable, OnDestroy } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { GridPosition } from '../../classes/models/grid-position';
import { LoggerService } from '../logger-service/logger.service';
import { PixelPosition } from '../../classes/models/pixel-position';

@Injectable({
  providedIn: 'root'
})
export abstract class RobotService implements OnDestroy {

  protected loggerService: LoggerService = inject(LoggerService);

  constructor() {
    console.log("RobotAspiratorDataService - constructor()");
  }

  /**
  * Nettoyage complet du service
  */
  public ngOnDestroy(): void {
    console.log("RobotAspiratorDataService - ngOnDestroy()");
    console.log('Service de robots arrêté');
  }

  /**
   * Calcule de nouvelles directions selon l'intervale donnée
   */
  public abstract calculateNewDirectionsForAllRobots(): void;

  /**
   *
   * @param robot
   */
  protected abstract activateReturnToBase(robot: RobotAspiratorModel): void;

  /**
   *
   * @param robotName
   * @param position
   * @param nextPosition
   */
  protected abstract setRobotIsReturningToBase(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Déplace manuellement un robot à une position pour le nettoyage
   *
   * @param robotName
   * @param position
   * @param nextPosition
   */
  protected abstract moveRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Arrêt d'un robot à une position
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  protected abstract stopRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Retourner à la base de charge
   *
   * @param robotModelInput
   */
  protected abstract retournerALaBase(robotModelInput: RobotAspiratorModel): GridPosition;

  /**
   *
   * @param batterie
   * @param position
   * @param basePosition
   * @param consommationParMouvement
   */
  protected abstract robotDoitRentrerALaBase(batterie: number, position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): boolean;

  /**
   * Estimer l'énergie nécessaire au robot pour retourner à la base
   *
   * @param position
   * @param basePosition
   * @param consommationParMouvement
   */
  protected abstract energieNecessairePourRetour(position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): number;

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  public abstract calculatePixelCoordinates(grid: GridPosition): PixelPosition;
}
