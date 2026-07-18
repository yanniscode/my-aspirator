import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model/robot-model';
import { PixelPosition } from '../../../classes/models/pixel-position';
import { GridPosition } from '../../../classes/models/grid-position';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Direction } from '../../../classes/utils/direction';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotDataService<T extends RobotModel = RobotModel> {

  public serviceName = "";

  protected httpClient = inject(HttpClient);

  protected url = "http://localhost:4200";
  protected mockRobotDatasPath = this.url + "";

  private PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  /**
  * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  */
  // readonly sur la déclaration TypeScript signifie que la référence au signal ne peut pas être réassignée — pas que le signal lui-même est immuable
  protected readonly _robotSignals: Map<string, WritableSignal<T>> = new Map<string, WritableSignal<T>>();
  public readonly robotSignals: Map<string, Signal<T>> = this._robotSignals;

  protected _robotNames: WritableSignal<string[]> = signal<string[]>([]);
  public readonly robotNames: Signal<string[]> = this._robotNames;

  constructor() {
    // constructor(protected http: HttpClient) {
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
  public getRobotSignal(robotName: string): Signal<T> | undefined {
    console.log("RobotDataService - getRobotSignal()");
    return this._robotSignals.get(robotName);
  }

  /**
   * Méthode générale pour instancier la liste de signaux de robots avec leurs données selon le type spécifié dans la classe qui en hérite
   *
   * @param robotAspiratorModelTab
   */
  public abstract setRobotSignalsList(robotAspiratorModelTab: T[]): void;

  /**
   * Renvoie la map de signaux de robot selon le type spécifié dans la classe qui en hérite
   */
  public abstract getRobotSignalsList(): Map<string, Signal<T>>;

  /**
   * enregistre un robot dans la Map de signaux selon le type spécifié dans la classe qui en hérite
   *
   * @param robotModel
   */
  protected abstract registerRobotInList(robotModel: T): void;

  /**
   * Renvoie les données mockées (fake database)
   */
  public abstract getJsonData(): Observable<any>;

  /**
   * Instancie la liste de robots avec leurs données mockées selon le type spécifié dans la classe qui en hérite
   */
  // public abstract createMockRobotsParams(): T[];

  public abstract setRobotAspiratorBases(robotModelTab: T[]): void;

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

  /**
 * Création des paramètres d'animation (appelé après l'instanciation des robots dans GameComponent)
 */
  public abstract createPlayersActionParams(): void;

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

  /**
 * Met à jour la cellule visitée
 */
  public abstract updateRobotsVisitedCells(): void;

  /**
 * Déplace manuellement un robot à une position pour le nettoyage
 *
 * @param robotName
 * @param position
 * @param nextPosition
 */
  public abstract moveRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void;


  /**
   * Arrêt d'un robot à une position
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  public abstract stopRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void;
}
