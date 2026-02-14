import { inject, Injectable, OnDestroy, Signal, signal, WritableSignal } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';
import { Position } from '../../classes/models/position';
import { MessageService } from '../message-service/message.service';
import { MaisonService } from '../maison-service/maison.service';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorDataService implements OnDestroy {

  private messageService: MessageService = inject(MessageService);
  private maisonService = inject(MaisonService);
  private cheminOptimalService: CheminOptimalService = inject(CheminOptimalService);

  // Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  // TODO: pourquoi readonly si WritableSignal ici ?? c'est la map qui est en lecture seule, pas les éléments ??
  private readonly robotSignals = new Map<string, WritableSignal<RobotAspiratorModel>>();

  // variables pour la vue: animation des robots
  private animationId?: number;
  private isRunning = false;

  // nouvelle version :
  // Signal public pour le progress (0 à 1)
  public animationProgress = signal(0);

  // Configuration de l'animation
  private readonly STEP_DURATION = 600; // Durée d'un déplacement complet (ms)
  private readonly PIXELS_PER_STEP = 50; // Pixels à parcourir en 1000ms

  private maisonModel: MaisonModel;
  private MAISON_CELL_WIDTH: number = 50;

  constructor() {
    console.log("RobotAspiratorDataService - constructor()");

    this.maisonModel = new MaisonModel();
  }

  /**
  * Nettoyage complet du service
  */
  ngOnDestroy(): void {
    console.log("RobotAspiratorDataService - ngOnDestroy()");

    this.stopAnimation();

    // TODO ?? à utiliser ?
    // nettoyage de l'animation pour startDrawCanvasTimer() - V1:
    // this.drawCanvasInterval.unsubscribe();
    // this.destroy$.next();
    // this.destroy$.complete();

    console.log('Service de robots arrêté');
  }

  /**
  * Nettoyage complet du service (animation où tous les robots s'arrête)
  */
  public onRobotsPause(): void {
    console.log("RobotAspiratorDataService - onRobotsPause()");

    this.robotSignals.forEach((robotSignal) => {
      let robot = robotSignal();
      if (!robot.isRobotStarted) {
        this.stopMovingRobot(robot.robotName, robot.isRobotReturningToBase);
      }
    });

    this.stopAnimation();

    console.log('Service de robots mis en pause');
  }

  // TODO ?? refacto dans service robot-data
  public getRobotsParams(): RobotAspiratorModel[] {
    console.log("RobotAspiratorDataService - getRobotsParams()");

    // 1 - Récupération des datas :
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    // robot1 test
    let robotName = "Aspiroman 1";
    let basePosition = { x: 0, y: 0 };
    // au départ, le robot est à la base:
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let startCoordinate = { x: 0, y: 0 };
    let targetCoordinate = { x: 0, y: 0 };
    let batterie = 5;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;

    // 2 - Instanciation du RobotAspiratorModel:
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

    console.log(robot1Model);

    // robot2 test
    robotName = "Aspiroman 2";
    basePosition = { x: 9, y: 0 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = { x: 450, y: 0 };
    targetCoordinate = { x: 450, y: 0 };
    batterie = 20;
    isRobotStarted = false;
    isRobotReturningToBase = false;

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

    console.log(robot2Model);

    // robot3 test
    robotName = "Aspiroman 3";
    basePosition = { x: 9, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = { x: 450, y: 350 };
    targetCoordinate = { x: 450, y: 350 };
    batterie = 30;
    isRobotStarted = false;
    isRobotReturningToBase = false;

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

    console.log(robot3Model);

    // robot3 test
    robotName = "Aspiroman 4";
    basePosition = { x: 0, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = { x: 0, y: 350 };
    targetCoordinate = { x: 0, y: 350 };
    batterie = 40;
    isRobotStarted = false;
    isRobotReturningToBase = false;

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

    console.log(robot4Model);

    // pour test de 1 ou plusieurs robots
    const robotModelTab: RobotAspiratorModel[] = [{ ...robot1Model }, { ...robot2Model }, { ...robot3Model }, { ...robot4Model }];
    // const robotModelTab = [{ ...robot1Model }];

    return robotModelTab;
  }

  /**
  * Enregistre un nouveau robot dans la liste avec une position initiale
  */
  public registerRobotInList(robotModel: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - registerRobotInList()");

    if (!this.robotSignals.has(robotModel.robotName)) {
      this.robotSignals.set(robotModel.robotName, signal(robotModel));
    } else {
      console.warn(`Robot ${robotModel.robotName} déjà enregistré`);
    }
  }

  /**
  * Désenregistre un robot et nettoie son signal
  */
  public unregisterRobotFromList(robotName: string): void {
    console.log("RobotAspiratorDataService - unregisterRobotFromList()");

    if (this.robotSignals.delete(robotName)) {
      console.log(`Robot ${robotName} désenregistré`);
    }
  }

  // GETTERS SUR LE ROBOT

  /**
 * Retourne le signal readonly du robot pour la réactivité
 */
  public getRobotSignal(robotName: string): Signal<RobotAspiratorModel | undefined> {
    console.log("RobotAspiratorDataService - getRobotSignal()");

    const writableSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);
    return writableSignal?.asReadonly() ?? signal(undefined);
  }

  /**
  * Lecture directe (non-réactive) de l'état actuel du robot
  */
  public getRobotModel(robotName: string): RobotAspiratorModel {
    console.log("RobotAspiratorDataService - getRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);
    return robotSignal ? robotSignal() : new RobotAspiratorModel();
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

  // TODO:SUPPRIMER ??
  // private getRobotDirection(lastPosition: Position, nextPosition: Position): Position {
  //   console.log("RobotAspiratorDataService - setAspiroDirection()");
  //   // Directions du robot (Attention: c'est un index dans le tableau de la maison ici, pas la position en px)
  //   const aspiroDirX = (nextPosition.x - lastPosition.x) === 1 ? 1 :
  //     (nextPosition.x - lastPosition.x) === -1 ? -1 : 0;
  //   const aspiroDirY = (nextPosition.y - lastPosition.y) === 1 ? 1 :
  //     (nextPosition.y - lastPosition.y) === -1 ? -1 : 0;
  //   return new Position(aspiroDirX, aspiroDirY);
  // }

  /**
  * Arrêt d'un robot à une position
  */
  // TODO: revoir selon modifs de moveRobot
  private stopMovingRobot(robotName: string, isRobotReturningToBase: boolean): void {
    console.log("RobotAspiratorDataService - stopMovingRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);
    if (!robotSignal) return;

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: false,
      lastPosition: robot.position,
      startCoordinate: robot.targetCoordinate,
      isRobotReturningToBase: isRobotReturningToBase
    }));

    console.log(`Robot ${robotSignal().robotName} arrêté à (${robotSignal().position.x}, ${robotSignal().position.y}) - Batterie = (${robotSignal().batterie})`);
  }

  // ************ méthodes pour l'animation des déplacements du robot (vue)

  public startRobotsMapInterval(maisonModel: MaisonModel): void {

    if (!this.maisonModel) return;
    this.maisonModel = maisonModel;

    if (this.isRunning) return;

    this.isRunning = true;
    let lastStepTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isRunning) return;

      const deltaTime = currentTime - lastStepTime;

      // Nouvelle direction toutes les 1000ms
      if (deltaTime >= this.STEP_DURATION) {
        // 1. Reset du temps
        lastStepTime = currentTime;
        // 2. Reset du progress à 0
        this.animationProgress.set(0);
        // 3. Calcul des nouvelles directions (qui lit progress = 0)
        this.calculateNewDirectionsForAllRobots();
        this.updateMaisonVisitedCells();
      } else {
        // En cours d'animation
        const progress = deltaTime / this.STEP_DURATION;
        // Mettre à jour le signal de progression
        this.animationProgress.set(progress);
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.calculateNewDirectionsForAllRobots();
    this.animationId = requestAnimationFrame(animate);
  }

  /**
 * Calcule de nouvelles directions toutes les 1000ms
 */
  private calculateNewDirectionsForAllRobots(): void {
    console.log("###### RobotAspiratorDataService - calculateNewDirectionsForAllRobots()");

    // Parcourt tous les robots
    this.robotSignals.forEach((robotSignal: WritableSignal<RobotAspiratorModel>, robotName) => {
      const robot = robotSignal();

      // IMPORTANT:
      // calculer et renvoyer la nouvelle position du robot (appelle l'algo de recherche du chemin)
      const newPosition: Position = this.calculateRobotNextPosition(robot);
      if (!newPosition) return;

      const newStartCoordinate = {
        x: robot.position.x * this.PIXELS_PER_STEP,
        y: robot.position.y * this.PIXELS_PER_STEP
      };

      const newTargetCoordinate = {
        x: newPosition.x * this.PIXELS_PER_STEP,
        y: newPosition.y * this.PIXELS_PER_STEP
      };

      console.log("### robotSignal.update()");

      this.moveRobot(robotName, newStartCoordinate, newPosition, newTargetCoordinate);

      console.log(`### ${robotName}: tableau [${newPosition.x},${newPosition.y}] → pixels (${newTargetCoordinate.x}, ${newTargetCoordinate.y})`);
    });
  }

  /**
  * Déplace manuellement un robot à une position
  */
  private moveRobot(robotName: string, newStartCoordinate: Position, newPosition: Position, newTargetCoordinate: Position): void {
    console.log("RobotAspiratorDataService - moveRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);
    if (!robotSignal) return;

    robotSignal.update(robot => ({
      ...robot,
      isRobotReturningToBase: robot.isRobotReturningToBase,
      lastPosition: { ...robot.position }, // la dernière position est modifiée avec l'actuelle
      position: { ...newPosition },        // la nouvelle position prend sa nouvelle valeur
      startCoordinate: { ...newStartCoordinate }, // la dernière coordonnée est modifiée avec l'actuelle
      targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa nouvelle valeur
      isRobotStarted: true,
    }));

    // on ne diminue le niveau de batterie que s'il y a une nouvelle position
    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {
      robotSignal.update(robot => ({
        ...robot,
        batterie: robot.batterie - robot.consommationParMouvement
      }));
    }
  }

  // mise à jour de robot (à l'unité)
  private calculateRobotNextPosition(robot: RobotAspiratorModel | undefined): Position {
    console.log("RobotAspiratorDataService - calculateRobotNextPosition()");

    if (!robot) return new Position();

    if (!robot.isRobotStarted) return robot.position;

    let nextPosition: Position = robot.position;

    if (robot.batterie === 0) {
      if (robot!.position.x === robot!.basePosition.x && robot!.position.y === robot!.basePosition.y
      ) {
        console.log(`### Le robot est à sa base et ne peut démarrer - Batterie: ${robot.batterie}%`);
      }
      else {
        console.log(`### Le robot est à l'arrêt en cours de parcours et ne peut redémarrer - Batterie: ${robot.batterie}%`);
      }
      this.stopMovingRobot(robot.robotName, robot.isRobotReturningToBase);
    }
    else if (robot.batterie > 0) {
      const batteryLimitExceeded: boolean = this.robotDoitRentrerALaBase(
        robot.batterie,
        robot.position,
        robot.basePosition,
        robot.consommationParMouvement
      );

      if (this.maisonService.toutEstNettoye() || batteryLimitExceeded) {
        console.log(`### updateAllRobots() - Maison entièrement nettoyée ou bien: limite de batterie atteinte : le robot doit rentrer à la base - Batterie: ${robot.batterie}%`);
        nextPosition = this.retournerALaBase(this.maisonModel, robot);
        console.log(`### Nouvelle position de retour à la base trouvée pour le Robot ${robot.robotName} : x = ${nextPosition.x}, y = ${nextPosition.y} - Batterie: ${robot.batterie}%`);
      } else {
        /** Dans cette version de l'algo: on prend la première position du chemin à chaque tour de boucle  */
        nextPosition = this.nettoyer(this.maisonModel, robot);
        console.log(`### Nouvelle position de nettoyage trouvée pour le Robot ${robot.robotName} : x = ${nextPosition.x}, y = ${nextPosition.y} - Batterie: ${robot.batterie}%`);
      }
    }

    return nextPosition;
  }

  // TODO: utiliser ??
  private stopAnimation(): void {
    console.log('Animation stopped');
    this.isRunning = false;
    if (this.animationId !== undefined) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
    this.robotSignals.clear();
  }

  /** méthodes propres au robot Aspirateur: */

  // Fonction principale pour nettoyer la maison
  private nettoyer(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): Position {
    console.log("RobotAspiratorDataService - nettoyer()");

    this.maisonModel = { ...maisonModelInput };

    // Chercher la prochaine cellule non visitée
    const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.maisonModel.maison, robotModelInput.position);
    console.log(prochaineCellule);

    if (!prochaineCellule) {
      console.log("Aucune cellule accessible non visitée trouvée");

      let positionRetourALaBase: Position = this.retournerALaBase(this.maisonModel, robotModelInput);
      console.log("positionRetourALaBase :" + positionRetourALaBase);

      if (!positionRetourALaBase) {
        console.log("Impossible de trouver un chemin vers la destination");
        return robotModelInput.position;
      }

      return positionRetourALaBase;
    }

    // Utiliser un algorithme de recherche de chemin optimal
    let nextPositionNettoyage: Position = this.cheminOptimalService.trouverPositionSuivante(
      this.maisonModel.maison, robotModelInput.position, prochaineCellule.cellStack[0].position
    );

    console.log("nextPositionNettoyage :" + nextPositionNettoyage);
    if (!nextPositionNettoyage) {
      console.log("Impossible de trouver un chemin vers la destination");
      return robotModelInput.position;
    }

    return nextPositionNettoyage;
  }

  // Retourner à la base de charge
  private retournerALaBase(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): Position {
    console.log("RobotAspiratorDataService - retournerALaBase()");
    console.log("Retour à la base de charge");

    this.maisonModel = maisonModelInput;

    // Trouver le chemin vers la base
    const positionRetourALaBase: Position = this.cheminOptimalService.trouverPositionSuivante(this.maisonModel.maison, robotModelInput.position, robotModelInput.basePosition);
    console.log("nextPosition :" + positionRetourALaBase);

    if (!positionRetourALaBase) {
      console.log("Impossible de trouver un chemin vers la base de charge!");
      return robotModelInput.position;
    }

    return positionRetourALaBase;
  }

  private robotDoitRentrerALaBase(batterie: number, position: Position, basePosition: Position, consommationParMouvement: number): boolean {
    console.log("RobotAspiratorDataService - robotDoitRentrerALaBase()");

    return (position && batterie <= this.energieNecessairePourRetour(position, basePosition, consommationParMouvement)) ?
      true : false;
  }

  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(position: Position, basePosition: Position, consommationParMouvement: number): number {
    console.log("RobotAspiratorDataService - energieNecessairePourRetour()");

    // Estimer la distance jusqu'à la base
    const distance = this.cheminOptimalService.distance(position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité si on veut
    return (distance * consommationParMouvement) * 1;
  }

  public updateMaisonVisitedCells(): void {
    this.robotSignals.forEach((robotSignal) => {
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
