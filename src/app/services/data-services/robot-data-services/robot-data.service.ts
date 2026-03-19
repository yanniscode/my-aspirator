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

  constructor() {
    this.PIXELS_PER_STEP = 50;
  }

  /**
  * Instancie la liste de robots avec leurs données
  */
  public abstract createRobotsParams(): RobotModel[];

  // public abstract setRobotListSignals(robotModelTab: RobotModel[]): void;

  /**
  * Désenregistre un robot et nettoie son signal
  */
  public unregisterRobotFromList(robotName: string): void {
    console.log("RobotDataService - unregisterRobotFromList()");

    if (this._robotSignals.delete(robotName)) {
      console.log(`Robot ${robotName} désenregistré`);
    }
  }

  /**
  * Enregistre un nouveau robot dans la liste
  */
  public registerRobotInList(robotModel: RobotModel): void {
    console.log("RobotDataService - registerRobotInList()");

    if (!this._robotSignals.has(robotModel.robotName)) {
      this._robotSignals.set(robotModel.robotName, signal(robotModel));
    } else {
      console.warn(`Robot ${robotModel.robotName} déjà enregistré`);
    }
  }

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
  getRobotCount(): number {
    return this.robotSignals.size;
  }

  // MÉTHODES D'ACTION SUR LE ROBOT:

  public updateCurrentCoordinates(name: string, progress: number): PixelPosition {
    console.log("RobotAnimationService - updateCurrentCoordinates()");

    let robotAnimationSignal = this.getRobotSignal(name) as Signal<RobotModel | undefined>;
    if (!robotAnimationSignal) return new PixelPosition(-50, -50);
    console.log(robotAnimationSignal);

    const robot: RobotModel | undefined = robotAnimationSignal();
    if (!robot) return new PixelPosition(-50, -50);

    if (!robot.isRobotStarted) return new PixelPosition(this.calculatePixelCoordinates(robot.position).x, this.calculatePixelCoordinates(robot.position).y);

    this.moveRobotCoordinates(name, robot.lastPosition, robot.position);

    // Dépend du signal animationProgress
    console.log("progress = " + progress);

    const startPosition = { ...robot.startCoordinate };
    const nextPosition = { ...robot.targetCoordinate };
    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    const newXCoordinate = startPosition.x + (nextPosition.x - startPosition.x) * progress;
    const newYCoordinate = startPosition.y + (nextPosition.y - startPosition.y) * progress;
    console.log("new Coordinate = " + newXCoordinate + " - " + newYCoordinate);

    // Attention: inversion des coordonnées pour l'affichage: col = x, row = y
    return new PixelPosition(newXCoordinate, newYCoordinate);
  }

  /**
  * Déplace manuellement un robot à une position pour le nettoyage
  */
  public moveRobotCoordinates(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotActionAspiratorService - moveRobotCoordinates()");

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
    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
  }
}
