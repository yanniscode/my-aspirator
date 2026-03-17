import { computed, inject, Injectable, OnDestroy, Signal, signal, WritableSignal } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';
import { GridPosition } from '../../classes/models/grid-position';
import { MessageService } from '../message-service/message.service';
import { MaisonService } from '../maison-service/maison.service';
import { PixelPosition } from '../../classes/models/pixel-position';
import { CellElement } from '../../classes/models/cellElement';
import { AssetService } from '../asset-service/asset.service';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorDataService implements OnDestroy {

  private messageService: MessageService = inject(MessageService);
  private assetService = inject(AssetService);
  private maisonService = inject(MaisonService);
  private cheminOptimalService: CheminOptimalService = inject(CheminOptimalService);

  // Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  // TODO: pourquoi readonly si WritableSignal ici ?? c'est la map qui est en lecture seule, pas les éléments ??
  private readonly _robotSignals: Map<string, WritableSignal<RobotAspiratorModel>> = new Map<string, WritableSignal<RobotAspiratorModel>>();
  public robotSignals: Map<string, Signal<RobotAspiratorModel>> = this._robotSignals;

  // Configuration de l'animation
  private readonly PIXELS_PER_STEP = 50; // Pixels à parcourir en 1000ms

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

  // TODO ?? refacto dans service robot-data
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
    let batterie = 3;
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
    // const robotModelTab: RobotAspiratorModel[] = [{ ...robot1Model }, { ...robot2Model }, { ...robot3Model }, { ...robot4Model }];
    const robotModelTab = [{ ...robot1Model }, { ...robot4Model }];
    // const robotModelTab = [{ ...robot1Model }];

    return robotModelTab;
  }

  /**
  * Enregistre un nouveau robot dans la liste avec une position initiale
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

  // GETTERS SUR LE ROBOT

  /**
 * Lecture directe (non-réactive) de l'état actuel du robot
 * Retourne le signal readonly du robot pour la réactivité
 */
  // TODO: revoir si check undefined nécessaire
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
 * Calcule de nouvelles directions toutes les 1000ms
 */
  public calculateNewDirectionsForAllRobots(): void {
    console.log("RobotAspiratorDataService - calculateNewDirectionsForAllRobots()");

    if (this._robotSignals.size <= 0) return;

    // Parcourt tous les robots
    this._robotSignals.forEach((robotSignal: WritableSignal<RobotAspiratorModel>, robotName) => {

      const robot = robotSignal();
      if (!robot) return;
      console.log(robot);

      let nextPosition: GridPosition = robot.position;
      if (!nextPosition) return;

      if (robot.batterie <= 0) {
        if (robot!.position.col === robot!.basePosition.col && robot!.position.row === robot!.basePosition.row
        ) {
          console.log(`### Le robot est à sa base et ne peut démarrer - Batterie: ${robot.batterie}%`);
        }
        else {
          console.log(`### Le robot est à l'arrêt en cours de parcours et ne peut redémarrer - Batterie: ${robot.batterie}%`);
        }

        this.stopRobot(robotName, robot.position, nextPosition);
        return;
      }
      else if (robot.batterie > 0) {

        if (robot.isRobotReturningToBase) {

          if (robot.position.col === robot.basePosition.col && robot.position.row === robot.basePosition.row) {
            this.stopRobot(robotName, robot.position, nextPosition);
            console.log("Arrêt effectué - retour à la base accomplit !");
            return;
          }

          this.activateReturnToBase(robot);
          return;
        }
        else if (this.maisonService.toutEstNettoye()) {

          console.log(`### updateAllRobots() - Maison entièrement nettoyée ou bien: limite de batterie atteinte : le robot doit rentrer à la base - Batterie: ${robot.batterie}%`);

          this.activateReturnToBase(robot);
          return;

        } else { // si la maison n'est pas totalement nettoyée

          // Dans cette version de l'algo de nettoyage: on prend la première position du chemin à chaque tour de boucle
          nextPosition = this.nettoyer(robot);

          const batteryLimitExceeded: boolean = this.robotDoitRentrerALaBase(
            robot.batterie,
            nextPosition,
            robot.basePosition,
            robot.consommationParMouvement
          );
          if (batteryLimitExceeded) {
            console.log("batteryLimitExceeded !");
            console.log(`### Limite de batterie dépassée pour le Robot ${robot.robotName} : row = ${robot.position.row}, col = ${robot.position.col} - Batterie: ${robot.batterie}%`);
            this.activateReturnToBase(robot);
            return;
          }

          console.log(`### Nouvelle position de nettoyage trouvée pour le Robot ${robot.robotName} : row = ${nextPosition.row}, col = ${nextPosition.col} - Batterie: ${robot.batterie}%`);
          // MAJ du robot: déplacement normal
          this.moveCleaningRobot(robotName, robot.position, nextPosition);
        }
      }
    });
  }

  private activateReturnToBase(robot: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - activateRobotReturningToBase()");

    const nextPosition = this.retournerALaBase(robot);
    if (!nextPosition) {
      this.stopRobot(robot.robotName, robot.position, nextPosition);
      return;
    }

    // MAJ du robot: retour à la base
    this.setRobotIsReturningToBase(robot.robotName, robot.position, nextPosition);

    console.log(`### Nouvelle position de retour à la base trouvée pour le Robot ${robot.robotName} : row = ${nextPosition.col}, col = ${nextPosition.row} - Batterie: ${robot.batterie}%`);
  }

  private setRobotIsReturningToBase(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotAspiratorDataService - setRobotIsReturningToBase()");
    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {
      robotSignal.update(robot => ({
        ...robot,
        isRobotStarted: true,
        isRobotReturningToBase: true,
        lastPosition: { ...robot.position }, // la précédente position est modifiée avec l'actuelle
        position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
        startCoordinate: { ...newStartCoordinate }, // la précédente coordonnée est modifiée avec l'actuelle
        targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa valeur suivante
        batterie: robot.batterie - robot.consommationParMouvement
      }));
      console.log(`### ${robotName}: tableau [${nextPosition.col},${nextPosition.row}] → pixels (${newTargetCoordinate.x}, ${newTargetCoordinate.y}) - batterie (${robot.batterie})`);
    } else {
      this.stopRobot(robotName, robot.position, nextPosition);
    }
  }

  /**
  * Déplace manuellement un robot à une position pour le nettoyage
  */
  private moveCleaningRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotAspiratorDataService - moveRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();
    if (!robot) return;

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {

      robotSignal.update(robot => ({
        ...robot,
        isRobotStarted: true,
        isRobotReturningToBase: false,  // le robot ne rentre pas à la base
        lastPosition: { ...robot.position }, // la précédente position est modifiée avec l'actuelle
        position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
        startCoordinate: { ...newStartCoordinate }, // la précédente coordonnée est modifiée avec l'actuelle
        targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa valeur suivante
        batterie: robot.batterie - robot.consommationParMouvement
      }));
    }
    console.log(`### ${robotName}: tableau [${nextPosition.col},${nextPosition.row}] → pixels (${newTargetCoordinate.x}, ${newTargetCoordinate.y}) - batterie (${robot.batterie})`);
  }

  /**
   *   * Arrêt d'un robot à une position
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  private stopRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotAspiratorDataService - stopRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    // if (newStartCoordinate.row !== newTargetCoordinate.row || newStartCoordinate.col !== newTargetCoordinate.col) {
    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: false,
      lastPosition: { ...robot.position }, // la précédente position est modifiée avec l'actuelle
      position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
      startCoordinate: { ...newStartCoordinate }, // la précédente coordonnée est modifiée avec l'actuelle
      targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa valeur suivante
    }));
    // }
  }

  /** méthodes propres au robot Aspirateur: */

  // Fonction principale pour nettoyer la maison
  private nettoyer(robotModelInput: RobotAspiratorModel): GridPosition {
    console.log("RobotAspiratorDataService - nettoyer()");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return new GridPosition();

    // Chercher la prochaine cellule non visitée
    const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(maisonModel.maison, robotModelInput.position);
    console.log(prochaineCellule);

    if (!prochaineCellule) {
      console.log("La maison est entièrement nettoyée !");

      let positionRetourALaBase: GridPosition = this.retournerALaBase(robotModelInput);
      console.log("positionRetourALaBase :" + positionRetourALaBase);

      if (!positionRetourALaBase) {
        console.log("Impossible de trouver un chemin vers la destination");
        return robotModelInput.position;
      }

      return positionRetourALaBase;
    }

    // Utiliser un algorithme de recherche de chemin optimal
    let nextPositionNettoyage: GridPosition = this.cheminOptimalService.trouverPositionSuivante(
      maisonModel.maison, robotModelInput.position, prochaineCellule.position
    );

    console.log("nextPositionNettoyage :" + nextPositionNettoyage);
    if (!nextPositionNettoyage) {
      console.log("Impossible de trouver un chemin vers la destination");
      return robotModelInput.position;
    }

    return nextPositionNettoyage;
  }

  // Retourner à la base de charge
  private retournerALaBase(robotModelInput: RobotAspiratorModel): GridPosition {
    console.log("RobotAspiratorDataService - retournerALaBase()");
    console.log("Retour à la base de charge");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return new GridPosition();

    // Trouver le chemin vers la base
    const positionRetourALaBase: GridPosition = this.cheminOptimalService.trouverPositionSuivante(maisonModel.maison, robotModelInput.position, robotModelInput.basePosition);
    console.log("nextPosition :" + positionRetourALaBase);

    if (!positionRetourALaBase) {
      console.log("Impossible de trouver un chemin vers la base de charge!");
      return robotModelInput.position;
    }

    return positionRetourALaBase;
  }

  private robotDoitRentrerALaBase(batterie: number, position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): boolean {
    console.log("RobotAspiratorDataService - robotDoitRentrerALaBase()");

    return (position && batterie <= this.energieNecessairePourRetour(position, basePosition, consommationParMouvement)) ?
      true : false;
  }

  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): number {
    console.log("RobotAspiratorDataService - energieNecessairePourRetour()");
    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return -1;

    // Estimer la distance jusqu'à la base (la distance de Manhattan ne suffit pas : elle ne tient pas compte des obstacles)
    const distance = this.distanceDeLaBase(maisonModel.maison, position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité si on veut
    return (distance * consommationParMouvement) * 1;
  }

  // recherche de la distance du robot à  sa base:
  private distanceDeLaBase(maison: CellElement[][], basePosition: GridPosition, position: GridPosition): number {
    console.log("CheminOptimalService - distanceDeLaBase()");
    const chemin: GridPosition[] = this.cheminOptimalService.trouverChemin(maison, position, basePosition);
    console.log(chemin.length);

    return chemin.length;
  }

  private calculatePixelCoordinates(grid: GridPosition): PixelPosition {
    // Conversion del'index dans le tableau (GridPosition) en Coordonnée en Pixels pour l'affichage CSS
    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
  }

  public updateMaisonVisitedCells(): void {
    this._robotSignals.forEach((robotSignal) => {
      console.log("RobotAspiratorDataService - updateMaisonVisitedCells");
      const robot: RobotAspiratorModel = robotSignal();
      // maj des datas de la maison: position visitée
      this.maisonService.updateMaisonCellules(robot.lastPosition);
    });
  }

  // TODO: revoir CSS de la maison si on affiche les logs dans l'ihm
  private log(message: string) {
    this.messageService.add(`RobotAspiratorBService: ${message}`);
  }
}
