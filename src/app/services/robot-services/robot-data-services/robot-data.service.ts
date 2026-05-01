import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
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
  // readonly sur la déclaration TypeScript signifie que la référence au signal ne peut pas être réassignée — pas que le signal lui-même est immuable
  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>> = new Map<string, WritableSignal<RobotModel>>();
  public readonly robotSignals: Map<string, Signal<RobotModel>> = this._robotSignals;

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

  // computed vérifiant si la map de robots un un robot "aspiroman" est à l'état démarré
  public readonly hasActiveRobots: Signal<boolean> = computed(() =>
    [...this._robotSignals.values()].some(signal => signal()?.isRobotStarted)
    // ou si l'on veut filtrer par type de robot:
    // [...this._robotSignals.values()].some(signal => (signal()?.robotType === "aspiroman") && signal()?.isRobotStarted)
  );

  public clearAllRobotsList(robotName: string): void {
    console.log("RobotDataFactoryService - clearAllRobotsList()");
    this.robotSignals.clear();
  }

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
