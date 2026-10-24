import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotDataService as RobotDataService } from '../robot-data.service';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { Direction } from '../../../../classes/utils/direction';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { Observable } from 'rxjs';
import { AlgoNettoyageService } from '../../robot-algos-deplacement-services/algo-nettoyage-service/algo-nettoyage.service';
import { Aspiroman, isAspiroman } from '../../../../data-access/robot-data-access/robot.model';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiromanDataService extends RobotDataService<Aspiroman> {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  protected algoNettoyageService = inject(AlgoNettoyageService);

  private loggerService = inject(LoggerService);

  protected override mockRobotDatasPath = this.url + "/assets/mock-data-services/mock-robot-data-services/mock-data-aspiroman-tab.json";

  // Map de Signals pour le progress (0 à 1) individualisé des joueurs
  public readonly _animationPlayerProgSignals: Map<string, WritableSignal<number>> = new Map<string, WritableSignal<number>>();

  // Configuration de l'animation
  private readonly CELL_SIZE = 50; // td-maison: width / height: 50px

  // Map de signaux contenant la direction de déplacement manuelle en cours de chaque Joueur
  private readonly _playerMoveDirectionSignals: Map<string, WritableSignal<string>> = new Map<string, WritableSignal<string>>();
  public readonly playerMoveDirectionSignals = this._playerMoveDirectionSignals;

  constructor() {
    console.log("AspiromanDataService - constructor");
    super();
    this.serviceName = "RobotAspiromanDataService";

    const players: Aspiroman[] = this.robotStore.players();
    if (!players) return;

    players.forEach(r => {
      this.playerMoveDirectionSignals.set(r.robotName, signal(""));
    });
  }

  /**
   * Création des paramètres d'animation (appelé après l'instanciation des robots dans GameComponent)
   */
  public override createPlayersActionParams(): void {
    this.robotStore.players().forEach(player => {
      if (player.robotType === "player") {
        this.playerMoveDirectionSignals.set(player.robotName, signal(""));
      }
    });
  }

  public override getJsonData(): Observable<any> {
    return this.httpClient.get(this.mockRobotDatasPath);
  }

  /**
   *
   * @param robotModelTab
   */
  public override setRobotAspiratorBases(robotModelTab: Aspiroman[]): void {
    console.log("RobotAspiromanDataService - setRobotAspiratorBases()");

    robotModelTab.forEach((robotModel: Aspiroman) => {
      const aspiromanModel = { ...robotModel };

      // Ajout de la base du robot dans la Maison
      const robotBasePosition: GridPosition = { ...aspiromanModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition, aspiromanModel.robotName);
    });
  }


  /**
   * Ajout de la base de chaque robot dans la Maison
   *
   * @param robotModelTab
   */
  public setAspiromenBases(robotModelTab: Aspiroman[]): void {
    console.log("RobotAspiromanDataService - setAspiromenBases()");

    robotModelTab.forEach((robotModel: Aspiroman) => {
      const aspiromanModel = { ...robotModel };

      const robotBasePosition: GridPosition = { ...aspiromanModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition, aspiromanModel.robotName);
    });
  }

  /**
   * Enregistre les signaux des robots dans une liste de son type spécifique (pour synchroniser les données)
   *
   * @param robotModel
   */
  public override setRobotSignalsList(aspiromanTab: Aspiroman[]): void {
    console.log("RobotAspiromanDataService - setRobotSignalsList()");

    this.robotStore.addRobots(aspiromanTab);
  }

  /**
   * Vue Map dérivée, reconstruite à la demande, jamais stockée :
   *
   * @returns
   */
  // Vue Map dérivée, reconstruite à la demande, jamais stockée :
  public override getRobotSignalsList(): Map<string, Signal<Aspiroman>> {
    const map = new Map<string, Signal<Aspiroman>>();
    return map;
  }

  /**
   * renvoie la position suivante (en pixels) du robot (pour le rendu en temps réel)
   *
   * @param name
   * @param progress
   * @returns
   */
  public override updateCurrentCoordinates(name: string, progress: number): PixelPosition {
    console.log("RobotAspiromanDataService - updateCurrentCoordinates()");

    const robot: Aspiroman | undefined = this.robotStore.playerByName(name);
    if (!robot) return new PixelPosition(-50, -50);

    // calcul de la nouvelle position en pixels du robot en fonction de son index (numéro de case dans le tableau représentant l'espace en 2D - la maison)
    const x = this.cellStore.calculatePixelCoordinates(robot.position).x;
    const y = this.cellStore.calculatePixelCoordinates(robot.position).y;

    if (!robot.isRobotStarted) return new PixelPosition(x, y);

    let newXCoordinate;
    let newYCoordinate;

    const startCoordinate = { ...robot.startCoordinate };
    const targetCoordinate = { ...robot.targetCoordinate };

    this.moveRobotCoordinates(name, robot.position, robot.position);

    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    newXCoordinate = startCoordinate.x + (targetCoordinate.x - startCoordinate.x) * progress;
    newYCoordinate = startCoordinate.y + (targetCoordinate.y - startCoordinate.y) * progress;
    console.log("new Coordinate = " + newXCoordinate + " - " + newYCoordinate);

    // Attention: inversion nécessaire des coordonnées pour l'affichage: col = x, row = y
    return new PixelPosition(newXCoordinate, newYCoordinate);
  }

  /**
   * Mise à jour de données du signal d'un robot : coordonnées (en pixels) de sa position cible (pas forcément le pixel suivant)
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  public override moveRobotCoordinates(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotDataService - moveRobotCoordinates()");

    const robot: Aspiroman | undefined = this.robotStore.playerByName(robotName);
    if (!robot) return;

    const newStartCoordinate: PixelPosition = this.cellStore.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.cellStore.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {

      this.robotStore.moveRobotCoordinates(robotName, newStartCoordinate, newTargetCoordinate);
    }
    console.log(`### ${robotName}: tableau[${nextPosition.col},${nextPosition.row}] → pixels(${newTargetCoordinate.x}, ${newTargetCoordinate.y})`);
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
   * Déplace manuellement un robot à une position
   */
  public override moveRobot(robotName: string): void {
    console.log("RobotAspiromanDataService - moveRobot()");

    const robot: Aspiroman | undefined = this.robotStore.playerByName(robotName);
    if (!robot) return;

    let playerMoveSignal = this.playerMoveDirectionSignals.get(robot.robotName);
    if (!playerMoveSignal) return;
    const mouvement = playerMoveSignal();
    console.log("mouvement = " + mouvement);

    let nextPosition: GridPosition = new GridPosition();
    let isRobotStarted = true;
    let robotDirection = "";
    let batterie = robot.batterie;

    if (robot.batterie <= 0) {
      nextPosition = { ...robot.position };
      isRobotStarted = false;
    } else {
      nextPosition = this.algoNettoyageService.obtenirPositionSuivanteManuelle(mouvement, robot.position, this.cellStore.maisonGrid());
      robotDirection = this.getRobotDirectionByDirection(mouvement);
    }

    const isFirstMove =
      robot.targetCoordinate.x === 0 && robot.targetCoordinate.y === 0;

    const consommationParMouvement = robot.consommationParMouvement;

    const startX = isFirstMove
      ? robot.position.col * this.CELL_SIZE
      : robot.targetCoordinate.x;
    const startY = isFirstMove
      ? robot.position.row * this.CELL_SIZE
      : robot.targetCoordinate.y;
    const startCoordinate: PixelPosition = { x: startX, y: startY };

    const lastPosition: GridPosition = { ...robot.position };
    const position: GridPosition = { ...nextPosition };

    // targetCoordinate = la destination en pixels de la nouvelle séquence de déplacement du robot (nouveau step)
    const targetX = nextPosition.col * this.CELL_SIZE;
    const targetY = nextPosition.row * this.CELL_SIZE;
    const targetCoordinate: PixelPosition = { x: targetX, y: targetY };

    this.robotStore.moveRobot(
      robotName,
      false,
      robotDirection,
      lastPosition,
      position,
      batterie,
      consommationParMouvement,
      startCoordinate,
      targetCoordinate
    );

    // Garde: vérifie si les collisions entre Joueurs et Bots
    this.robotStore.checkCollisions();

    console.log(`### ${robotName}: moveRobot nextPosition[${nextPosition.col},${nextPosition.row}] - batterie(${robot.batterie})`);

    this.playerMoveDirectionSignals.set(robot.robotName, signal(""));
  }

  /**
 * Arrêt d'un robot à une position
 *
 * @param robotName
 * @param position
 * @param nextPosition
 * @returns
 */
  public override stopRobot(robotName: string): void {
    console.log("RobotAspiromanDataService - stopRobot()");

    const robotSignal: Aspiroman | undefined = this.robotStore.playerByName(robotName);
    if (!robotSignal) return;

    this.robotStore.stopRobot(robotName);
  }

  /**
   * MAJ des positions visitées de la maison
   */
  public override updateRobotsVisitedCells(): void {
    console.log("RobotActionAspiratorService - updateRobotsVisitedCells()");
    this.robotStore.players().forEach((robot) => {
      this.maisonDataNettoyageService.updateVisitedCell(robot.lastPosition, robot.robotName);
    });
  }

  /**
   *
   * @param message
   */
  private log(message: string) {
    this.loggerService.add(`RobotAspiromanDataService: ${message}`);
  }
}
