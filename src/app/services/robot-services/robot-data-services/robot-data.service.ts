import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { PixelPosition } from '../../../classes/models/pixel-position';
import { GridPosition } from '../../../classes/models/grid-position';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Direction } from '../../../classes/utils/direction';
import { Robot, RobotStateItem } from '../../../data-access/robot-data-access/robot.model';
import { RobotStore } from '../../../data-stores/robot.signal-store';
import { CellStore } from '../../../data-stores/maison.signal-store';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotDataService<T extends Robot = Robot> {

  public serviceName = "";

  protected httpClient = inject(HttpClient);
  protected robotStore = inject(RobotStore);
  protected cellStore = inject(CellStore);

  protected url = "http://localhost:4200";
  protected mockRobotDatasPath = this.url + "";

  /**
  * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  */
  // readonly sur la déclaration TypeScript signifie que la référence au signal ne peut pas être réassignée — pas que le signal lui-même est immuable
  protected readonly robotSignals: Signal<RobotStateItem[]> = this.robotStore.robots;

  protected _robotIds: WritableSignal<string[]> = signal<string[]>([]);
  public readonly robotIds: Signal<string[]> = this._robotIds;

  constructor() {
  }

  /**
   * Méthode générale pour instancier la liste de signaux de robots avec leurs données selon le type spécifié dans la classe qui en hérite
   *
   * @param robotAspiratorModelTab
   */
  public abstract setRobotSignalsList(robotAspiratorModelTab: T[]): void;

  /**
   * Renvoie les données mockées (fake database)
   */
  public abstract getJsonData(): Observable<any>;

  public abstract setRobotAspiratorBases(robotModelTab: T[]): void;

  /**
   * Nettoye la map générique de signaux
   */
  public clearAllRobotsList(): void {
    console.log("RobotDataService - clearAllRobotsList()");
    this.robotStore.removeRobots();
  }

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
  public abstract moveRobotCoordinates(robotId: string, position: GridPosition, nextPosition: GridPosition): void;

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
 * @param robotId
 * @param position
 * @param nextPosition
 */
  public abstract moveRobot(robotId: string, position: GridPosition, nextPosition: GridPosition): void;


  /**
   * Arrêt d'un robot à une position
   *
   * @param robotId
   * @param position
   * @param nextPosition
   * @returns
   */
  public abstract stopRobot(robotId: string, position: GridPosition, nextPosition: GridPosition): void;
}
