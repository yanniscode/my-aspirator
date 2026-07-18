import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotDataService as RobotDataService } from '../robot-data.service';
import { RobotAspiratorModel } from '../../../../classes/models/robot-model/robot-aspirator-model/robot-aspirator-model';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotAspiratorDataService extends RobotDataService<RobotAspiratorModel> {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  private loggerService = inject(LoggerService);

  protected override mockRobotDatasPath = this.url + "/assets/mock-data-services/mock-robot-data-services/mock-data-robot-aspirator-tab.json";

  // TODO: individualiser le progress pour les bots aussi ?
  // Signal pour le progress (0 à 1) synchronisé des bots
  public readonly _animationBotsProgSignal: WritableSignal<number> = signal(0);

  constructor() {
    console.log("RobotAspiratorDataService - constructor");

    super();
    this.serviceName = "RobotAspiratorDataService";
  }

  public override getJsonData(): Observable<any> {
    return this.httpClient.get(this.mockRobotDatasPath);
  }

  public override setRobotAspiratorBases(robotModelTab: RobotAspiratorModel[]): void {
    console.log("RobotAspiratorDataService - setRobotAspiratorBases()");

    robotModelTab.forEach((robotModel: RobotAspiratorModel) => {
      const robotAspiratorModel = { ...robotModel };

      // Ajout de la base du robot dans la Maison
      const robotBasePosition: GridPosition = { ...robotAspiratorModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition);
    });
  }

  /**
   * Enregistre les signaux des robots dans une liste de son type spécifique (pour synchroniser les données)
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
      this._robotNames.update(robotNames => [...robotNames, robotModel.robotName]);
    });
  }

  /**
  * Enregistre un nouveau robot dans la liste de son type spécifique
  */
  protected registerRobotInList(robotModel: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - registerRobotInList()");

    if (!this.robotSignals.has(robotModel.robotName)) {
      this._robotSignals.set(robotModel.robotName, signal(robotModel));
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
    return this._robotSignals;
  }

  /**
   * Création des paramètres d'animation (appelé après l'instanciation des robots dans GameComponent)
   * (abstract car pas implémentée pour les bots)
   */
  public override createPlayersActionParams(): void { }

  /**
   *
   * @param name
   * @returns
   */
  public override updateCurrentCoordinates(name: string): PixelPosition {
    console.log("RobotDataService - updateCurrentCoordinates()");

    let robotAspiratorSignal = this._robotSignals.get(name) as Signal<RobotAspiratorModel | undefined>;
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

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
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
   * Déplace manuellement un robot à une position pour le nettoyage
   */
  public override moveRobot(robotName: string, nextPosition: GridPosition): void {
    console.log("RobotActionAspiratorService - moveRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();
    if (!robot) return;

    // targetCoordinate = la destination en pixels de la nouvelle séquence de déplacement du robot (nouveau step)
    const targetX = robot.targetCoordinate.x;
    const targetY = robot.targetCoordinate.y;

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: true,
      isRobotReturningToBase: false,        // le robot ne rentre pas à la base
      robotDirection: this.getRobotDirectionByPosition(robot.position, nextPosition),
      lastPosition: { ...robot.position },  // la précédente position est modifiée avec l'actuelle
      position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
      batterie: robot.batterie - robot.consommationParMouvement,
      // Coordonnées en pixel pour l'interpolation dans drawObject:
      // Attention: ici seule startCoordinate est mise à jour car en cas de mise en pause,
      // on peut avoir des bugs d'affichage au nouveau départ des bots
      // la première trame serait positionnée sur la case précédente sans setter startCoordinate sur robot.targetCoordinate ici:
      startCoordinate: { x: targetX, y: targetY },
    }));

    console.log(`### ${robotName}: tableau[${nextPosition.col},${nextPosition.row}]- batterie(${robot.batterie})`);
  }

  public moveRobotReturningToBase(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotActionAspiratorService - moveRobotReturningToBase()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {
      const targetX = robot.targetCoordinate.x;
      const targetY = robot.targetCoordinate.y;

      robotSignal.update(robot => ({
        ...robot,
        isRobotStarted: true,
        isRobotReturningToBase: true,
        robotDirection: this.getRobotDirectionByPosition(robot.position, nextPosition),
        lastPosition: { ...robot.position },  // la précédente position est modifiée avec l'actuelle
        position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
        batterie: robot.batterie - robot.consommationParMouvement,
        startCoordinate: { x: targetX, y: targetY },
      }));
      console.log(`### ${robotName}: tableau [${nextPosition.col},${nextPosition.row}] → pixels (${newTargetCoordinate.x}, ${newTargetCoordinate.y}) - batterie (${robot.batterie})`);
    } else {
      this.stopRobot(robotName);
    }
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

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
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
      const robot: RobotAspiratorModel = robotSignal();
      this.maisonDataNettoyageService.updateVisitedCell(robot.lastPosition, true);
    });
  }

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
