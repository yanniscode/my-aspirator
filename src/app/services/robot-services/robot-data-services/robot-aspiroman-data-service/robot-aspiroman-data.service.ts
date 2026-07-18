import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotDataService as RobotDataService } from '../robot-data.service';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { Direction } from '../../../../classes/utils/direction';
import { AspiromanModel } from '../../../../classes/models/robot-model/aspiroman-model/aspiroman-model';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { Observable } from 'rxjs';
import { AlgoNettoyageService } from '../../robot-algos-deplacement-services/algo-nettoyage-service/algo-nettoyage.service';
import { MaisonModel } from '../../../../classes/models/maison-model/maison-model';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiromanDataService extends RobotDataService<AspiromanModel> {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  protected algoNettoyageService = inject(AlgoNettoyageService);

  private loggerService = inject(LoggerService);

  protected override mockRobotDatasPath = this.url + "/assets/mock-data-services/mock-robot-data-services/mock-data-aspiroman-tab.json";

  /**
   * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
   */
  public readonly maisonSignal: Signal<MaisonModel> = computed(() =>
    this.maisonDataNettoyageService.maisonSignal()
  );

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

    this.robotSignals.forEach(aspiromanSignal => {
      this.playerMoveDirectionSignals.set(aspiromanSignal().robotName, signal(""));
    });
  }

  /**
   * Création des paramètres d'animation (appelé après l'instanciation des robots dans GameComponent)
   */
  public override createPlayersActionParams(): void {
    this.robotSignals.forEach(robotSignals => {
      if (robotSignals().robotType === "player") {
        this.playerMoveDirectionSignals.set(robotSignals().robotName, signal(""));
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
  public override setRobotAspiratorBases(robotModelTab: AspiromanModel[]): void {
    console.log("RobotAspiromanDataService - setRobotAspiratorBases()");

    robotModelTab.forEach((robotModel: AspiromanModel) => {
      const aspiromanModel = { ...robotModel };

      // Ajout de la base du robot dans la Maison
      const robotBasePosition: GridPosition = { ...aspiromanModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition);
    });
  }


  /**
   * Ajout de la base de chaque robot dans la Maison
   *
   * @param robotModelTab
   */
  public setAspiromenBases(robotModelTab: AspiromanModel[]): void {
    console.log("RobotAspiromanDataService - setAspiromenBases()");

    robotModelTab.forEach((robotModel: AspiromanModel) => {
      const aspiromanModel = { ...robotModel };

      const robotBasePosition: GridPosition = { ...aspiromanModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition);
    });
  }

  /**
   * Enregistre les signaux des robots dans une liste de son type spécifique (pour synchroniser les données)
   *
   * @param robotModel
   */
  public override setRobotSignalsList(robotModelTab: AspiromanModel[]): void {
    console.log("RobotAspiromanDataService - setRobotSignalsList()");

    robotModelTab.forEach((robotModel: AspiromanModel) => {
      // 1/ ajout du robot à la liste:
      const robotAspiratorModel: AspiromanModel = { ...robotModel };
      this.registerRobotInList(robotAspiratorModel);

      // 2/ enregistrer le nom de chaque robot dans la liste de robotNames pour le template binding:
      this._robotNames.update(robotNames => [...robotNames, robotModel.robotName]);
    });
  }

  /**
  * Enregistre un nouveau robot dans la liste de son type spécifique
  */
  protected registerRobotInList(robotModel: AspiromanModel): void {
    console.log("RobotAspiromanDataService - registerRobotInList()");

    if (!this.robotSignals.has(robotModel.robotName)) {
      this._robotSignals.set(robotModel.robotName, signal(robotModel));
    } else {
      console.warn(`Robot ${robotModel.robotName} déjà enregistré`);
    }
  }

  /**
   * Méthode de factory qui récupère les signaux des robots du type spécifié dans une liste (pour synchroniser les données)
   *
   * @returns
   */
  public override getRobotSignalsList(): Map<string, Signal<AspiromanModel>> {
    console.log("RobotAspiromanDataService - getRobotSignalsList()");

    // TODO: revoir appel de params spés
    return this.robotSignals;
  }

  /**
   * renvoie la position suivante (en pixels) du robot (pour le rendu en temps réel)
   *
   * @param name
   * @param progress
   * @returns
   */
  public override updateCurrentCoordinates(name: string, progress: number, mustMove?: boolean): PixelPosition {
    console.log("RobotDataService - updateCurrentCoordinates()");

    let aspiromanSignal = this.robotSignals.get(name) as Signal<AspiromanModel | undefined>;
    if (!aspiromanSignal) return new PixelPosition(-50, -50);
    console.log(aspiromanSignal);

    const robot: AspiromanModel | undefined = aspiromanSignal();
    if (!robot) return new PixelPosition(-50, -50);

    // calcul de la nouvelle position en pixels du robot en fonction de son index (numéro de case dans le tableau représentant l'espace en 2D - la maison)
    const x = this.calculatePixelCoordinates(robot.position).x;
    const y = this.calculatePixelCoordinates(robot.position).y;
    if (!robot.isRobotStarted) return new PixelPosition(x, y);
    let newXCoordinate;
    let newYCoordinate;

    const startCoordinate = { ...robot.startCoordinate };
    const targetCoordinate = { ...robot.targetCoordinate };
    // TODO: revoir: bidouille
    if (mustMove === false) {
      this.moveRobotCoordinates(name, robot.position, robot.position);
      // TODO: important: targetcoordinate
      newXCoordinate = startCoordinate.x;
      newYCoordinate = startCoordinate.y;
    }
    else {
      this.moveRobotCoordinates(name, robot.lastPosition, robot.position);

      // const progress = this. animationProgress();
      // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
      newXCoordinate = startCoordinate.x + (targetCoordinate.x - startCoordinate.x) * progress;
      newYCoordinate = startCoordinate.y + (targetCoordinate.y - startCoordinate.y) * progress;
      console.log("new Coordinate = " + newXCoordinate + " - " + newYCoordinate);
    }
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

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this._robotSignals.get(robotName);
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
    console.log("RobotActionAspiromanService - moveRobot()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();
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
      nextPosition = this.algoNettoyageService.obtenirPositionSuivanteManuelle(mouvement, robot.position, this.maisonSignal().maison);
      robotDirection = this.getRobotDirectionByDirection(mouvement);
      batterie -= robot.consommationParMouvement;
    }

    const isFirstMove =
      robot.targetCoordinate.x === 0 && robot.targetCoordinate.y === 0;

    const startX = isFirstMove
      ? robot.position.col * this.CELL_SIZE
      : robot.targetCoordinate.x;
    const startY = isFirstMove
      ? robot.position.row * this.CELL_SIZE
      : robot.targetCoordinate.y;

    // targetCoordinate = la destination en pixels du nouveau step
    const targetX = nextPosition.col * this.CELL_SIZE;
    const targetY = nextPosition.row * this.CELL_SIZE;

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: isRobotStarted,
      isRobotReturningToBase: false,
      robotDirection: robotDirection,
      lastPosition: { ...robot.position },
      position: { ...nextPosition },
      batterie: batterie,
      // ✅ coordonnées pixel pour l'interpolation dans drawObject
      startCoordinate: { x: startX, y: startY },
      targetCoordinate: { x: targetX, y: targetY },
    }));

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
    console.log("RobotActionAspiratorService - stopRobot()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: false,
    }));
  }

  /**
   * MAJ des positions visitées de la maison
   */
  public override updateRobotsVisitedCells(): void {
    console.log("RobotActionAspiratorService - updateRobotsVisitedCells()");

    this.robotSignals.forEach((robotSignal) => {
      const robot: AspiromanModel = robotSignal();
      this.maisonDataNettoyageService.updateVisitedCell(robot.lastPosition, true);
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
