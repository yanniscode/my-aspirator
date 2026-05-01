import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model/robot-model';
import { PixelPosition } from '../../../classes/models/pixel-position';
import { GridPosition } from '../../../classes/models/grid-position';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotDataService {

  private PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  /**
  * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  */
  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>> = new Map<string, WritableSignal<RobotModel>>();
  public robotSignals: Map<string, WritableSignal<RobotModel>> = this._robotSignals;

  // Signal pour le progress (0 à 1)
  protected readonly _animationProgress: WritableSignal<number> = signal(0);
  public animationProgress: WritableSignal<number> = this._animationProgress;

  constructor() {
    this.PIXELS_PER_STEP = 50;
  }

  /**
  * Instancie la liste de robots avec leurs données
  */
  public abstract createRobotsParams(): RobotModel[];

  /**
   *
   *  Lecture directe (non-réactive) de l'état actuel du robot
   *  Retourne le signal readonly du robot
   *
   * @param robotName
   * @returns
   */
  public getRobotSignal(robotName: string): Signal<RobotModel | undefined> {
    console.log("RobotDataService - getRobotSignal()");

    const writableSignal: WritableSignal<RobotModel> | undefined = this._robotSignals.get(robotName);
    return writableSignal?.asReadonly() ?? signal(undefined);
  }

  /**
  * Renvoie la map de signaux de robot
  */
  public abstract getRobotSignalsList(): Map<string, Signal<RobotModel>>;

  /**
  * Retourne le nombre de robots actifs
  */
  // getRobotCount(): number {
  //   return this.robotSignals.size;
  // }

  // MÉTHODES D'ACTION SUR LE ROBOT:

  /**
   *
   * @param name
   */
  public abstract updateCurrentCoordinates(name: string, progress: number): PixelPosition;

  /**
  * Déplace manuellement un robot à une position pour le nettoyage
  */
  public abstract moveRobotCoordinates(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  public calculatePixelCoordinates(grid: GridPosition): PixelPosition {
    // console.log("RobotDataService - calculatePixelCoordinates()");

    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
  }
}
