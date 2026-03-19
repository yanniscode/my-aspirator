import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model';
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
  * Retourne le nombre de robots actifs
  */
  // getRobotCount(): number {
  //   return this.robotSignals.size;
  // }

  // MÉTHODES D'ACTION SUR LE ROBOT:

  public updateCurrentCoordinates(name: string): PixelPosition {
    console.log("RobotDataService - updateCurrentCoordinates()");

    let robotAnimationSignal = this.getRobotSignal(name) as Signal<RobotModel | undefined>;
    if (!robotAnimationSignal) return new PixelPosition(-50, -50);
    console.log(robotAnimationSignal);

    const robot: RobotModel | undefined = robotAnimationSignal();
    if (!robot) return new PixelPosition(-50, -50);

    // calcul de la position actuelle en pixels du robot en fonction de son index dans le tableau représentant l'espace en 2D (la maison)
    // (nécessaire sinon bug au retour à la base)
    const x = this.calculatePixelCoordinates(robot.position).x;
    const y = this.calculatePixelCoordinates(robot.position).y;
    if (!robot.isRobotStarted) return new PixelPosition(x, y);

    this.moveRobotCoordinates(name, robot.lastPosition, robot.position);

    const progress: Signal<number> = this._animationProgress.asReadonly();

    const startCoordinate = { ...robot.startCoordinate };
    const targetCoordinate = { ...robot.targetCoordinate };
    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    const newXCoordinate = startCoordinate.x + (targetCoordinate.x - startCoordinate.x) * progress();
    const newYCoordinate = startCoordinate.y + (targetCoordinate.y - startCoordinate.y) * progress();
    console.log("new Coordinate = " + newXCoordinate + " - " + newYCoordinate);

    // Attention: inversion des coordonnées pour l'affichage: col = x, row = y
    return new PixelPosition(newXCoordinate, newYCoordinate);
  }

  /**
  * Déplace manuellement un robot à une position pour le nettoyage
  */
  public moveRobotCoordinates(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotDataService - moveRobotCoordinates()");

    const robotSignal: WritableSignal<RobotModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();
    if (!robot) return;

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {

      robotSignal.update(robot => ({
        ...robot,
        startCoordinate: { ...newStartCoordinate }, // la précédente coordonnée est modifiée avec l'actuelle
        targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa valeur suivante
      }));
    }
    console.log(`### ${robotName}: tableau[${nextPosition.col},${nextPosition.row}] → pixels(${newTargetCoordinate.x}, ${newTargetCoordinate.y})`);
  }

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
