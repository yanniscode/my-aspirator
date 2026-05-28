import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotDataService as RobotDataService } from '../robot-data.service';
import { RobotAspiratorModel } from '../../../../classes/models/robot-model/robot-aspirator-model/robot-aspirator-model';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { AssetRobotService } from '../../robot-graphics-services/asset-robot-service/asset-robot.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { Direction } from '../../../../classes/utils/direction';
import { PixelPosition } from '../../../../classes/models/pixel-position';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiratorDataService extends RobotDataService {

  private assetRobotService = inject(AssetRobotService);
  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  private loggerService = inject(LoggerService);

  /**
* Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
*/
  protected readonly _robotAspiratorSignals: Map<string, WritableSignal<RobotAspiratorModel>> = new Map<string, WritableSignal<RobotAspiratorModel>>();
  public robotAspiratorSignals: Map<string, WritableSignal<RobotAspiratorModel>> = this._robotAspiratorSignals;

  private robotNames = signal<string[]>([]);

  // TODO: individualiser le progress pour les bots aussi ?
  // Signal pour le progress (0 à 1) synchronisé des bots
  public readonly _animationBotsProgSignal: WritableSignal<number> = signal(0);


  constructor() {
    console.log("RobotAspiratorDataService - constructor");
    super();
    this.serviceName = "RobotAspiratorDataService";
  }

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  // appelée par MainComponent
  public override createRobotsParams(): RobotAspiratorModel[] {
    console.log("RobotAspiratorDataService - createRobotsParams()");

    // 1 - Récupération des datas :

    // robot1 test
    let robotName = "Aspiroman 1";
    let robotType = "aspirator";
    // au départ, le robot est à la base:
    let robotDirection = Direction.EAST;
    let lastPosition = new GridPosition(0, 0);
    let position = { ...lastPosition };
    let startCoordinate = this.calculatePixelCoordinates(lastPosition);
    let targetCoordinate = this.calculatePixelCoordinates(lastPosition);
    let isRobotStarted = false;
    let robotWidth = 42;
    // TODO: labelColor a ajouter EN DUR au model:
    let labelColor = this.assetRobotService.getRandomRobotLabelColor();
    let basePosition = new GridPosition(0, 0);
    let batterie = 6;
    let consommationParMouvement = 0.5;
    let isRobotReturningToBase = false;

    // 2 - Instanciation d'un robot:
    let robot1Model = new RobotAspiratorModel();
    robot1Model.robotName = robotName;
    robot1Model.robotType = robotType;
    robot1Model.robotDirection = robotDirection;
    robot1Model.lastPosition = { ...lastPosition };
    robot1Model.position = { ...position };
    robot1Model.startCoordinate = { ...startCoordinate };
    robot1Model.targetCoordinate = { ...targetCoordinate };
    robot1Model.isRobotStarted = isRobotStarted;
    robot1Model.robotWidth = robotWidth;
    robot1Model.labelColor = labelColor;
    robot1Model.basePosition = { ...basePosition };
    robot1Model.batterie = batterie;
    robot1Model.consommationParMouvement = consommationParMouvement;
    robot1Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot1Model);

    // robot2 test
    robotName = "Aspiroman 2";
    robotType = "aspirator";
    robotDirection = Direction.WEST;
    lastPosition = new GridPosition(0, 9);
    position = { ...lastPosition };
    startCoordinate = this.calculatePixelCoordinates(lastPosition);
    targetCoordinate = this.calculatePixelCoordinates(lastPosition);
    isRobotStarted = false;
    robotWidth = 42;
    labelColor = this.assetRobotService.getRandomRobotLabelColor();
    basePosition = new GridPosition(0, 9);
    batterie = 20;
    consommationParMouvement = 0.5;
    isRobotReturningToBase = false;

    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.robotType = robotType;
    robot2Model.robotDirection = robotDirection;
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.startCoordinate = { ...startCoordinate };
    robot2Model.targetCoordinate = { ...targetCoordinate };
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.robotWidth = robotWidth;
    robot2Model.labelColor = labelColor;
    robot2Model.basePosition = { ...basePosition };
    robot2Model.batterie = batterie;
    robot2Model.consommationParMouvement = consommationParMouvement;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot2Model);

    // robot3 test
    robotName = "Aspiroman 3";
    robotType = "aspirator";
    robotDirection = Direction.WEST;
    lastPosition = new GridPosition(7, 9);
    position = { ...lastPosition };
    startCoordinate = this.calculatePixelCoordinates(lastPosition);
    targetCoordinate = this.calculatePixelCoordinates(lastPosition);
    isRobotStarted = false;
    robotWidth = 42;
    labelColor = this.assetRobotService.getRandomRobotLabelColor();
    basePosition = new GridPosition(7, 9);
    batterie = 30;
    consommationParMouvement = 0.5;
    isRobotReturningToBase = false;

    let robot3Model = new RobotAspiratorModel();
    robot3Model.robotName = robotName;
    robot3Model.robotType = robotType;
    robot3Model.lastPosition = { ...lastPosition };
    robot3Model.robotDirection = robotDirection;
    robot3Model.position = { ...position };
    robot3Model.startCoordinate = { ...startCoordinate };
    robot3Model.targetCoordinate = { ...targetCoordinate };
    robot3Model.isRobotStarted = isRobotStarted;
    robot3Model.robotWidth = robotWidth;
    robot3Model.labelColor = labelColor;
    robot3Model.basePosition = { ...basePosition };
    robot3Model.batterie = batterie;
    robot3Model.consommationParMouvement = consommationParMouvement;
    robot3Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot3Model);

    // robot4 test
    robotName = "Aspiroman 4";
    robotType = "aspirator";
    robotDirection = Direction.EAST;
    lastPosition = new GridPosition(7, 0);
    position = { ...lastPosition };
    startCoordinate = this.calculatePixelCoordinates(lastPosition);
    targetCoordinate = this.calculatePixelCoordinates(lastPosition);
    isRobotStarted = false;
    robotWidth = 42;
    labelColor = this.assetRobotService.getRandomRobotLabelColor();
    basePosition = new GridPosition(7, 0);
    batterie = 40;
    consommationParMouvement = 0.5;
    isRobotReturningToBase = false;

    let robot4Model = new RobotAspiratorModel();
    robot4Model.robotName = robotName;
    robot4Model.robotType = robotType;
    robot4Model.lastPosition = { ...lastPosition };
    robot4Model.robotDirection = robotDirection;
    robot4Model.position = { ...position };
    robot4Model.startCoordinate = { ...startCoordinate };
    robot4Model.targetCoordinate = { ...targetCoordinate };
    robot4Model.isRobotStarted = isRobotStarted;
    robot4Model.robotWidth = robotWidth;
    robot4Model.labelColor = labelColor;
    robot4Model.basePosition = { ...basePosition };
    robot4Model.batterie = batterie;
    robot4Model.consommationParMouvement = consommationParMouvement;
    robot4Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot4Model);

    // pour test de 1 ou plusieurs robots
    const robotModelTab: RobotAspiratorModel[] = [{ ...robot1Model }, { ...robot2Model }, { ...robot3Model }, { ...robot4Model }];
    // const robotModelTab: RobotAspiratorModel[] = [{ ...robot2Model }, { ...robot3Model }, { ...robot4Model }];
    // const robotModelTab: RobotAspiratorModel[] = [{ ...robot1Model }, { ...robot4Model }];
    // const robotModelTab: RobotAspiratorModel[] = [{ ...robot1Model }];
    // const robotModelTab: RobotAspiratorModel[] = [];
    // spécifique aux robots aspirateurs: ajout de leurs bases de charge
    this.setRobotAspiratorBases(robotModelTab);

    // Ajout des robots à la liste de Signals:
    this.setRobotSignalsList(robotModelTab);

    return robotModelTab;
  }

  private setRobotAspiratorBases(robotModelTab: RobotAspiratorModel[]): void {
    console.log("RobotAspiratorDataService - setRobotAspiratorBases()");

    robotModelTab.forEach((robotModel: RobotAspiratorModel) => {
      const robotAspiratorModel = { ...robotModel };

      // Ajout de la base du robot dans la Maison
      const robotBasePosition: GridPosition = { ...robotAspiratorModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition);
    });
  }

  /**
   * Méthode de factory qui enregistre les signaux des robots dans une liste (pour synchroniser les données)
   *
   * @param robotModel
   */
  public override setRobotSignalsList(robotAspiratorModelTab: RobotAspiratorModel[]): void {
    console.log("RobotAspiratorDataService - setRobotSignalsList()");

    robotAspiratorModelTab.forEach((robotModel: RobotAspiratorModel) => {
      // 1/ ajout du robot à la liste:
      const robotAspiratorModel: RobotAspiratorModel = { ...robotModel };
      this.registerRobotInList(robotAspiratorModel);

      // 2/ enregistrer le nom de chaque robot dans la liste de robotNames pour le template binding:
      this.robotNames.update(robotNames => [...robotNames, robotModel.robotName]);
    });
  }

  /**
  * Enregistre un nouveau robot dans la liste
  */
  protected registerRobotInList(robotModel: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - registerRobotInList()");

    if (!this.robotAspiratorSignals.has(robotModel.robotName)) {
      this.robotAspiratorSignals.set(robotModel.robotName, signal(robotModel));
    } else {
      console.warn(`Robot ${robotModel.robotName} déjà enregistré`);
    }
  }

  /**
 * Méthode de factory qui récupère les signaux des robots selon le type spécifié dans une liste (pour synchroniser les données)
 *
 * @returns
 */
  public override getRobotSignalsList(): Map<string, Signal<RobotAspiratorModel>> {
    console.log("RobotAspiratorDataService - getRobotSignalsList()");

    // TODO: revoir appel de params spés
    return this.robotAspiratorSignals;
  }

  /**
   *
   * @param name
   * @returns
   */
  public override updateCurrentCoordinates(name: string): PixelPosition {
    console.log("RobotDataService - updateCurrentCoordinates()");

    let robotAspiratorSignal = this.robotAspiratorSignals.get(name) as Signal<RobotAspiratorModel | undefined>;
    console.log("robotAspiratorSignal = " + robotAspiratorSignal);
    if (!robotAspiratorSignal) return new PixelPosition(-50, -50);
    console.log(robotAspiratorSignal);

    const robot: RobotAspiratorModel | undefined = robotAspiratorSignal();
    if (!robot) return new PixelPosition(-50, -50);

    // calcul de la position actuelle en pixels du robot en fonction de son index dans le tableau représentant l'espace en 2D (la maison)
    // (nécessaire sinon bug au retour à la base)
    const x = this.calculatePixelCoordinates(robot.position).x;
    const y = this.calculatePixelCoordinates(robot.position).y;
    if (!robot.isRobotStarted) return new PixelPosition(x, y);

    this.moveRobotCoordinates(name, robot.lastPosition, robot.position);

    // const progress: Signal<number> = this.animationProgress;
    console.log("updateCurrentCoordinates - progress = " + this._animationBotsProgSignal());

    const startCoordinate = { ...robot.startCoordinate };
    const targetCoordinate = { ...robot.targetCoordinate };

    if (!robot.isRobotStarted) return new PixelPosition(startCoordinate.x, startCoordinate.y);

    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    const newXCoordinate = startCoordinate.x + (targetCoordinate.x - startCoordinate.x) * this._animationBotsProgSignal();
    const newYCoordinate = startCoordinate.y + (targetCoordinate.y - startCoordinate.y) * this._animationBotsProgSignal();
    console.log("startCoordinate.x = " + startCoordinate.x + " / targetCoordinate.x = " + targetCoordinate.x + " / progress = " + this._animationBotsProgSignal() + " / new Coordinate = " + newXCoordinate + " - " + newYCoordinate);

    // Attention: inversion des coordonnées pour l'affichage: col = x, row = y
    return new PixelPosition(newXCoordinate, newYCoordinate);
  }

  /**
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  public override moveRobotCoordinates(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotDataService - moveRobotCoordinates()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotAspiratorSignals.get(robotName);
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

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
