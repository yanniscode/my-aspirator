import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotDataService as RobotDataService } from '../robot-data.service';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { AssetRobotService } from '../../robot-graphics-services/asset-robot-service/asset-robot.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { Direction } from '../../../../classes/utils/direction';
import { AspiromanModel } from '../../../../classes/models/robot-model/aspiroman-model/aspiroman-model';
import { RobotModel } from '../../../../classes/models/robot-model/robot-model';
import { PixelPosition } from '../../../../classes/models/pixel-position';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiromanDataService extends RobotDataService {

  private assetRobotService = inject(AssetRobotService);
  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  private loggerService = inject(LoggerService);

  /**
   * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
   */
  protected readonly _aspiromanSignals: Map<string, WritableSignal<AspiromanModel>> = new Map<string, WritableSignal<AspiromanModel>>();
  public aspiromanSignals: Map<string, WritableSignal<AspiromanModel>> = this._aspiromanSignals;

  private robotNames = signal<string[]>([]);

  constructor() {
    console.log("AspiromanDataService - constructor");
    super();
  }

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  /**
   * Construit la Map de robots avec leurs paramètres
   *
   * @returns
   */
  public override createRobotsParams(): RobotModel[] {
    console.log("RobotAspiromanDataService - createRobotsParams()");

    // 1 - Récupération des datas des robots

    // robot1 test
    let robotName = "Player 1";
    let robotType = "aspiroman";
    let basePosition = new GridPosition(3, 3);
    // au départ, le robot est à la base:
    let robotDirection = Direction.EAST;
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let startCoordinate = this.calculatePixelCoordinates(basePosition);
    let targetCoordinate = this.calculatePixelCoordinates(basePosition);
    let batterie = 4.5;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;
    let robotWidth = 42;
    let labelColor = this.assetRobotService.getRandomRobotLabelColor();

    // 2 - Instanciation d'un robot:
    let robotPlayer1Model = new AspiromanModel();
    robotPlayer1Model.robotName = robotName;
    robotPlayer1Model.robotType = robotType;
    robotPlayer1Model.basePosition = { ...basePosition };
    robotPlayer1Model.robotDirection = robotDirection;
    robotPlayer1Model.lastPosition = { ...lastPosition };
    robotPlayer1Model.position = { ...position };
    robotPlayer1Model.startCoordinate = { ...startCoordinate };
    robotPlayer1Model.targetCoordinate = { ...targetCoordinate };
    robotPlayer1Model.batterie = batterie;
    robotPlayer1Model.isRobotStarted = isRobotStarted;
    robotPlayer1Model.isRobotReturningToBase = isRobotReturningToBase;
    robotPlayer1Model.robotWidth = robotWidth;
    robotPlayer1Model.labelColor = labelColor;

    console.log(robotPlayer1Model);

    // pour test de 1 ou plusieurs robots
    const robotModelTab: AspiromanModel[] = [{ ...robotPlayer1Model }];
    // const robotModelTab: AspiromanModel[] = [];

    // spécifique aux robots aspirateurs: ajout de leurs bases de charge
    this.setAspiromenBases(robotModelTab);

    // Ajout des robots à la liste de Signals:
    this.setRobotSignalsList(robotModelTab);

    return robotModelTab;
  }

  /**
   * Ajout de la base de chaque robot dans la Maison
   *
   * @param robotModelTab
   */
  private setAspiromenBases(robotModelTab: AspiromanModel[]): void {
    console.log("RobotAspiromanDataService - setAspiromenBases()");

    robotModelTab.forEach((robotModel: AspiromanModel) => {
      const aspiromanModel = { ...robotModel };

      const robotBasePosition: GridPosition = { ...aspiromanModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition);
    });
  }

  /**
   * Enregistre les signaux des robots dans une liste (pour synchroniser les données)
   *
   * @param robotModel
   */
  public setRobotSignalsList(robotModelTab: AspiromanModel[]): WritableSignal<string[]> {
    console.log("RobotAspiromanDataService - setRobotSignalsList()");

    robotModelTab.forEach((robotModel: AspiromanModel) => {
      // 1/ ajout du robot à la liste:
      const robotAspiratorModel: AspiromanModel = { ...robotModel };
      this.registerRobotInList(robotAspiratorModel);

      // 2/ enregistrer le nom de chaque robot dans la liste de robotNames pour le template binding:
      this.robotNames.update(robotNames => [...robotNames, robotModel.robotName]);
    });

    return this.robotNames;
  }

  /**
  * Enregistre un nouveau robot dans la liste
  */
  public registerRobotInList(robotModel: AspiromanModel): void {
    console.log("RobotAspiromanDataService - registerRobotInList()");

    if (!this.aspiromanSignals.has(robotModel.robotName)) {
      this.aspiromanSignals.set(robotModel.robotName, signal(robotModel));
    } else {
      console.warn(`Robot ${robotModel.robotName} déjà enregistré`);
    }
  }

  /**
   * Méthode de factory qui récupère les signaux des robots du type spécifié dans une liste (pour synchroniser les données)
   *
   * @returns
   */
  public getRobotSignalsList(): Map<string, Signal<AspiromanModel>> {
    console.log("RobotAspiromanDataService - getRobotSignalsList()");

    // TODO: revoir appel de params spés
    return this.aspiromanSignals;
  }

  /**
   * renvoie la position suivante (en pixels) du robot (pour le rendu en temps réel)
   *
   * @param name
   * @param progress
   * @returns
   */
  public updateCurrentCoordinates(name: string, progress: number): PixelPosition {
    console.log("RobotDataService - updateCurrentCoordinates()");

    let aspiromanSignal = this.aspiromanSignals.get(name) as Signal<AspiromanModel | undefined>;
    if (!aspiromanSignal) return new PixelPosition(-50, -50);
    console.log(aspiromanSignal);

    const robot: AspiromanModel | undefined = aspiromanSignal();
    if (!robot) return new PixelPosition(-50, -50);

    // calcul de la nouvelle position en pixels du robot en fonction de son index (numéro de case dans le tableau représentant l'espace en 2D - la maison)
    const x = this.calculatePixelCoordinates(robot.position).x;
    const y = this.calculatePixelCoordinates(robot.position).y;
    if (!robot.isRobotStarted) return new PixelPosition(x, y);

    this.moveRobotCoordinates(name, robot.lastPosition, robot.position);

    const startCoordinate = { ...robot.startCoordinate };
    const targetCoordinate = { ...robot.targetCoordinate };
    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    const newXCoordinate = startCoordinate.x + (targetCoordinate.x - startCoordinate.x) * progress;
    const newYCoordinate = startCoordinate.y + (targetCoordinate.y - startCoordinate.y) * progress;
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
  public moveRobotCoordinates(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotDataService - moveRobotCoordinates()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this.aspiromanSignals.get(robotName);
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
   *
   * @param message
   */
  private log(message: string) {
    this.loggerService.add(`RobotAspiromanDataService: ${message}`);
  }
}
