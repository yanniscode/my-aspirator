import { inject, Injectable } from '@angular/core';
import { GridPosition } from '../../../classes/models/grid-position';
import { PixelPosition } from '../../../classes/models/pixel-position';
import { LoggerService } from '../../main-services/logger-service/logger.service';
import { Direction } from '../../../classes/utils/direction';

@Injectable({
  providedIn: 'root'
})
export abstract class RobotActionService {

  public serviceName = "";

  protected loggerService: LoggerService = inject(LoggerService);

  /**
   * Calcule de nouvelles directions selon l'intervale donnée
   */
  public abstract calculateNewDirectionsForAllRobots(): void;

  /**
   * Met à jour la cellule visitée
   */
  public abstract updateRobotsVisitedCells(): void;

  /**
   * Orientation dans l'espace 2D (cardinalité)
   *
   * @param position
   * @param nextPosition
   * @returns
   */
  protected getRobotDirectionByPosition(position: GridPosition, nextPosition: GridPosition): string {
    // dx: 0, dy: -1  // Nord
    if (position.col - nextPosition.col === 0 && position.row - nextPosition.row === -1) {
      return Direction.NORTH;
    }
    // dx: -1, dy: 0   // Est
    else if (position.col - nextPosition.col === -1 && position.row - nextPosition.row === 0) {
      return Direction.EAST;
    }
    // dx: 0, dy: 1   // Sud
    else if (position.col - nextPosition.col === 0 && position.row - nextPosition.row === 1) {
      return Direction.SOUTH;
    }
    // dx: 1, dy: 0  // Ouest
    else if (position.col - nextPosition.col === 1 && position.row - nextPosition.row === 0) {
      return Direction.WEST;
    }

    return "";
  }

  protected getRobotDirectionByDirection(mouvement: string): string {
    // dx: 0, dy: -1  // Nord
    if (mouvement === "ArrowUp") {
      return Direction.NORTH;
    }
    // dx: -1, dy: 0   // Est
    else if (mouvement === "ArrowRight") {
      return Direction.EAST;
    }
    // dx: 0, dy: 1   // Sud
    else if (mouvement === "ArrowDown") {
      return Direction.SOUTH;
    }
    // dx: 1, dy: 0  // Ouest
    else if (mouvement === "ArrowLeft") {
      return Direction.WEST;
    }

    return "";
  }

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
  public abstract stopRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  public abstract calculatePixelCoordinates(grid: GridPosition): PixelPosition;
}
