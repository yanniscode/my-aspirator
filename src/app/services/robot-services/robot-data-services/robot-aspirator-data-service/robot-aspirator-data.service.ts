import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotDataService as RobotDataService } from '../robot-data.service';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { Observable } from 'rxjs';
import { RobotAspirator } from '../../../../data-access/robot-data-access/robot.model';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotAspiratorDataService extends RobotDataService<RobotAspirator> {

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

  public override setRobotAspiratorBases(robotModelTab: RobotAspirator[]): void {
    console.log("RobotAspiratorDataService - setRobotAspiratorBases()");

    robotModelTab.forEach((robotModel: RobotAspirator) => {
      const robotAspiratorModel = { ...robotModel };

      // Ajout de la base du robot dans la Maison
      const robotBasePosition: GridPosition = { ...robotAspiratorModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition, robotAspiratorModel.robotName);
    });
  }

  robots: RobotAspirator[] = [];

  /**
   *  Init : dispatche simplement l'action
   */
  public override setRobotSignalsList(robotAspiratorTab: RobotAspirator[]): void {
    console.log("RobotAspiratorDataService - setRobotSignalsList()");

    this.robotStore.addRobots(robotAspiratorTab);
  }


  /**
   *  Vue Map dérivée, reconstruite à la demande, jamais stockée :
   */
  public override getRobotSignalsList(): Map<string, Signal<RobotAspirator>> {
    console.log("RobotAspiratorDataService - getRobotSignalsList()");

    const map = new Map<string, Signal<RobotAspirator>>();
    console.log('robots RobotAspirator:', this.robotStore.aspirators());

    return map;
  }

  // Accès à UN robot, réactif :
  public robotSignalByName(name: string): Signal<RobotAspirator | undefined> {
    return computed(() => this.robotStore.robotByName(name) as RobotAspirator | undefined);
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

    const robot = this.robotStore.robotByName(name);

    // const robot: RobotAspirator | undefined = robotAspiratorSignal();
    if (!robot) return new PixelPosition(-50, -50);

    // calcul de la position actuelle en pixels du robot en fonction de son index dans le tableau représentant l'espace en 2D (la maison)
    // (nécessaire sinon bug au retour à la base)
    const x = this.cellStore.calculatePixelCoordinates(robot.position).x;
    const y = this.cellStore.calculatePixelCoordinates(robot.position).y;
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

    const robot: RobotAspirator | undefined = this.robotStore.aspiratorByName(robotName);
    if (!robot) return;

    const newStartCoordinate: PixelPosition = this.cellStore.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.cellStore.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {

      this.robotStore.moveRobotCoordinates(robotName, newStartCoordinate, newTargetCoordinate);
    }
    console.log(`### ${robotName}: tableau[${nextPosition.col},${nextPosition.row}] → pixels(${newTargetCoordinate.x}, ${newTargetCoordinate.y})`);
  }

  /**
   * Déplace manuellement un robot à une position pour le nettoyage
   */
  public override moveRobot(robotName: string, nextPosition: GridPosition): void {
    console.log("RobotActionAspiratorService - moveRobot()");

    const robot: RobotAspirator | undefined = this.robotStore.aspiratorByName(robotName);
    if (!robot) return;

    const robotDirection = this.getRobotDirectionByPosition(robot.position, nextPosition);
    const lastPosition = { ...robot.position };
    const position = { ...nextPosition };
    const batterie = robot.batterie;
    const consommationParMouvement = robot.consommationParMouvement;

    // targetCoordinate = la destination en pixels de la nouvelle séquence de déplacement du robot (nouveau step)
    const startCoordinate: PixelPosition = { ...robot.targetCoordinate };
    const targetCoordinate: PixelPosition = { ...robot.targetCoordinate };

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

    this.robotStore.checkCollisions();

    console.log(`### ${robotName}: tableau[${nextPosition.col},${nextPosition.row}]- batterie(${robot.batterie})`);
  }

  public moveRobotReturningToBase(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotActionAspiratorService - moveRobotReturningToBase()");

    const robot: RobotAspirator | undefined = this.robotStore.aspiratorByName(robotName);
    if (!robot) return;

    const newStartCoordinate: PixelPosition = this.cellStore.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.cellStore.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {

      const robotDirection = this.getRobotDirectionByPosition(robot.position, nextPosition);
      const position = { ...robot.position };
      const batterie = robot.batterie;
      const consommationParMouvement = robot.consommationParMouvement;

      // targetCoordinate = la destination en pixels de la nouvelle séquence de déplacement du robot (nouveau step)
      const startCoordinate: PixelPosition = { ...robot.targetCoordinate };
      const targetCoordinate: PixelPosition = { ...robot.targetCoordinate };

      this.robotStore.moveRobot(robotName, true, robotDirection, position, nextPosition, batterie, consommationParMouvement, startCoordinate, targetCoordinate);

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

    const robot: RobotAspirator | undefined = this.robotStore.aspiratorByName(robotName);
    if (!robot) return;

    this.robotStore.stopRobot(robotName);
  }

  /**
   * MAJ des positions visitées de la maison
   */
  public override updateRobotsVisitedCells(): void {
    console.log("RobotActionAspiratorService - updateRobotsVisitedCells()");
    const robots: RobotAspirator[] = this.robotStore.aspirators();
    if (!robots || (robots && robots?.length <= 0)) return;

    robots.forEach((robot: RobotAspirator) => {
      this.maisonDataNettoyageService.updateVisitedCell(robot.lastPosition, robot.robotName);
    });
  }

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
