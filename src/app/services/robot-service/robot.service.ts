import { computed, inject, Injectable, OnDestroy, Signal, signal, WritableSignal } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { GridPosition } from '../../classes/models/grid-position';
import { MessageService } from '../message-service/message.service';
import { MaisonService } from '../maison-service/maison.service';
import { PixelPosition } from '../../classes/models/pixel-position';
import { AssetService } from '../asset-service/asset.service';
import { NettoyageService } from '../nettoyage-service/nettoyage.service';

@Injectable({
  providedIn: 'root'
})
export abstract class RobotService implements OnDestroy {

  protected messageService: MessageService = inject(MessageService);
  protected assetService = inject(AssetService);
  protected maisonService = inject(MaisonService);
  protected nettoyageService: NettoyageService = inject(NettoyageService);

  // Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  // TODO: pourquoi readonly si WritableSignal ici ?? c'est la map qui est en lecture seule, pas les éléments ??
  protected readonly _robotSignals: Map<string, WritableSignal<RobotAspiratorModel>> = new Map<string, WritableSignal<RobotAspiratorModel>>();
  public robotSignals: Map<string, Signal<RobotAspiratorModel>> = this._robotSignals;

  // Configuration de l'animation
  protected PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  public readonly maisonSignal: Signal<MaisonModel> = computed(() =>
    this.maisonService.maisonSignal()
  );

  constructor() {
    console.log("RobotAspiratorDataService - constructor()");
  }

  /**
  * Nettoyage complet du service
  */
  public ngOnDestroy(): void {
    console.log("RobotAspiratorDataService - ngOnDestroy()");
    // this.stopAllAnimation();
    console.log('Service de robots arrêté');
  }

  // TODO: possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  // appelée par MainComponent
  public getRobotsParams(): RobotAspiratorModel[] {
    console.log("RobotAspiratorDataService - getRobotsParams()");

    // 1 - Récupération des datas :
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    // robot1 test
    let robotName = "Aspiroman 1";
    let basePosition = new GridPosition(0, 0);
    // au départ, le robot est à la base:
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let startCoordinate = this.calculatePixelCoordinates(basePosition);
    let targetCoordinate = this.calculatePixelCoordinates(basePosition);
    let batterie = 4;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;
    let robotWidth = 50;
    let labelColor = this.assetService.getRandomRobotLabelColor();

    // 2 - Instanciation d'un robot:
    let robot1Model = new RobotAspiratorModel();
    robot1Model.robotName = robotName;
    robot1Model.basePosition = { ...basePosition };
    robot1Model.lastPosition = { ...lastPosition };
    robot1Model.position = { ...position };
    robot1Model.startCoordinate = { ...startCoordinate };
    robot1Model.targetCoordinate = { ...targetCoordinate };
    robot1Model.batterie = batterie;
    robot1Model.isRobotStarted = isRobotStarted;
    robot1Model.isRobotReturningToBase = isRobotReturningToBase;
    robot1Model.robotWidth = robotWidth;
    robot1Model.labelColor = labelColor;

    console.log(robot1Model);

    // robot2 test
    robotName = "Aspiroman 2";
    basePosition = new GridPosition(0, 9);
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = this.calculatePixelCoordinates(basePosition);
    targetCoordinate = this.calculatePixelCoordinates(basePosition);
    batterie = 20;
    isRobotStarted = false;
    isRobotReturningToBase = false;
    robotWidth = 50;
    labelColor = this.assetService.getRandomRobotLabelColor();

    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.basePosition = { ...basePosition };
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.startCoordinate = { ...startCoordinate };
    robot2Model.targetCoordinate = { ...targetCoordinate };
    robot2Model.batterie = batterie;
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;
    robot2Model.labelColor = labelColor;
    robot2Model.robotWidth = robotWidth;

    console.log(robot2Model);

    // robot3 test
    robotName = "Aspiroman 3";
    basePosition = new GridPosition(7, 9);
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = this.calculatePixelCoordinates(basePosition);
    targetCoordinate = this.calculatePixelCoordinates(basePosition);
    batterie = 30;
    isRobotStarted = false;
    isRobotReturningToBase = false;
    robotWidth = 50;
    labelColor = this.assetService.getRandomRobotLabelColor();

    let robot3Model = new RobotAspiratorModel();
    robot3Model.robotName = robotName;
    robot3Model.basePosition = { ...basePosition };
    robot3Model.lastPosition = { ...lastPosition };
    robot3Model.position = { ...position };
    robot3Model.startCoordinate = { ...startCoordinate };
    robot3Model.targetCoordinate = { ...targetCoordinate };
    robot3Model.batterie = batterie;
    robot3Model.isRobotStarted = isRobotStarted;
    robot3Model.isRobotReturningToBase = isRobotReturningToBase;
    robot3Model.robotWidth = robotWidth;
    robot3Model.labelColor = labelColor;

    console.log(robot3Model);

    // robot4 test
    robotName = "Aspiroman 4";
    basePosition = new GridPosition(7, 0);
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = this.calculatePixelCoordinates(basePosition);
    targetCoordinate = this.calculatePixelCoordinates(basePosition);
    batterie = 40;
    isRobotStarted = false;
    isRobotReturningToBase = false;
    robotWidth = 50;
    labelColor = this.assetService.getRandomRobotLabelColor();

    let robot4Model = new RobotAspiratorModel();
    robot4Model.robotName = robotName;
    robot4Model.basePosition = { ...basePosition };
    robot4Model.lastPosition = { ...lastPosition };
    robot4Model.position = { ...position };
    robot4Model.startCoordinate = { ...startCoordinate };
    robot4Model.targetCoordinate = { ...targetCoordinate };
    robot4Model.batterie = batterie;
    robot4Model.isRobotStarted = isRobotStarted;
    robot4Model.isRobotReturningToBase = isRobotReturningToBase;
    robot4Model.robotWidth = robotWidth;
    robot4Model.labelColor = labelColor;

    console.log(robot4Model);

    // pour test de 1 ou plusieurs robots
    const robotModelTab: RobotAspiratorModel[] = [{ ...robot1Model }, { ...robot2Model }, { ...robot3Model }, { ...robot4Model }];
    // const robotModelTab = [{ ...robot1Model }, { ...robot4Model }];
    // const robotModelTab = [{ ...robot1Model }];

    return robotModelTab;
  }

  /**
  * Enregistre un nouveau robot dans la liste
  */
  public registerRobotInList(robotModel: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - registerRobotInList()");

    if (!this._robotSignals.has(robotModel.robotName)) {
      this._robotSignals.set(robotModel.robotName, signal(robotModel));
    } else {
      console.warn(`Robot ${robotModel.robotName} déjà enregistré`);
    }
  }

  /**
  * Désenregistre un robot et nettoie son signal
  */
  public unregisterRobotFromList(robotName: string): void {
    console.log("RobotAspiratorDataService - unregisterRobotFromList()");

    if (this._robotSignals.delete(robotName)) {
      console.log(`Robot ${robotName} désenregistré`);
    }
  }

  /**
   *
   *  Lecture directe (non-réactive) de l'état actuel du robot
   *  Retourne le signal readonly du robot
   *
   * @param robotName
   * @returns
   */
  public getRobotSignal(robotName: string): Signal<RobotAspiratorModel | undefined> {
    console.log("RobotAspiratorDataService - getRobotSignal()");

    const writableSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    return writableSignal?.asReadonly() ?? signal(undefined);
  }

  // TODO: à voir si utilisation possible
  /**
* Retourne la liste des noms de tous les robots enregistrés
*/
  // getAllRobotNames(): string[] {
  //   return Array.from(this.robotSignals.keys());
  // }

  /**
  * Retourne le nombre de robots actifs
  */
  // getRobotCount(): number {
  //   return this.robotSignals.size;
  // }

  // MÉTHODES D'ACTION SUR LE ROBOT:

  /**
* Met à jour un robot dans la liste de signaux (appelé par la boucle d'animation)
*/
  // private updateRobotModel(robotModel: RobotAspiratorModel | undefined): void {
  //   if (!robotModel) return;

  //   const robotSignal = this.robotSignals.get(robotModel.robotName);
  //   if (robotSignal) {
  //     robotSignal.set(robotModel);
  //   }
  // }

  /**
   * Calcule de nouvelles directions selon l'intervale donnée
   */
  public abstract calculateNewDirectionsForAllRobots(): void;

  /**
   *
   * @param robot
   */
  protected abstract activateReturnToBase(robot: RobotAspiratorModel): void;

  /**
   *
   * @param robotName
   * @param position
   * @param nextPosition
   */
  protected abstract setRobotIsReturningToBase(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Déplace manuellement un robot à une position pour le nettoyage
   *
   * @param robotName
   * @param position
   * @param nextPosition
   */
  protected abstract moveRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Arrêt d'un robot à une position
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  protected abstract stopRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void;

  /**
   * Retourner à la base de charge
   *
   * @param robotModelInput
   */
  protected abstract retournerALaBase(robotModelInput: RobotAspiratorModel): GridPosition;

  /**
   *
   * @param batterie
   * @param position
   * @param basePosition
   * @param consommationParMouvement
   */
  protected abstract robotDoitRentrerALaBase(batterie: number, position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): boolean;

  /**
   * Estimer l'énergie nécessaire au robot pour retourner à la base
   *
   * @param position
   * @param basePosition
   * @param consommationParMouvement
   */
  protected abstract energieNecessairePourRetour(position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): number;

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  protected calculatePixelCoordinates(grid: GridPosition): PixelPosition {
    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
  }

  /**
   * MAJ des position visitée de la maison
   */
  public abstract updateRobotsVisitedCells(): void;
}
