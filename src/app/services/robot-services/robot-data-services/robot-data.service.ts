import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model/robot-model';
import { PixelPosition } from '../../../classes/models/pixel-position';
import { GridPosition } from '../../../classes/models/grid-position';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotDataService {

  public serviceName = "";

  private PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  /**
  * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  */
  // readonly sur la déclaration TypeScript signifie que la référence au signal ne peut pas être réassignée — pas que le signal lui-même est immuable
  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>> = new Map<string, WritableSignal<RobotModel>>();
  public readonly robotSignals: Map<string, Signal<RobotModel>> = this._robotSignals;

  constructor() {
    this.PIXELS_PER_STEP = 50;
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
   * Méthode générale pour instancier la liste de signaux de robots avec leurs données selon le type spécifié dans la classe qui en hérite
   *
   * @param robotAspiratorModelTab
   */
  public abstract setRobotSignalsList(robotAspiratorModelTab: RobotModel[]): void;

  /**
   * Renvoie la map de signaux de robot selon le type spécifié dans la classe qui en hérite
   */
  public abstract getRobotSignalsList(): Map<string, Signal<RobotModel>>;

  /**
   * enregistre un robot dans la Map de signaux selon le type spécifié dans la classe qui en hérite
   *
   * @param robotModel
   */
  protected abstract registerRobotInList(robotModel: RobotModel): void;

  /**
   * Instancie la liste de robots avec leurs données selon le type spécifié dans la classe qui en hérite
   */
  public abstract createRobotsParams(): RobotModel[];

  /**
   * Nettoye la map générique de signaux
   */
  public clearAllRobotsList(): void {
    console.log("RobotDataService - clearAllRobotsList()");
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
