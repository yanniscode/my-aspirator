import { inject, Injectable, OnDestroy, Signal, signal, WritableSignal } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';
import { Position } from '../../classes/models/position';
import { Cell } from '../../classes/models/cell';
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

  private robotCount = 0; // TODO: utiliser pour la mise en pause globale, si plus de robot actif

  // attendre l'initialisation des robots avant de déclencher effect()
  // private areRobotsInitialized = signal(false);

  // variables pour la uue: animation des robots
  // type recommandé ici: ReturnType<typeof setInterval>
  private intervalId?: ReturnType<typeof setInterval>;
  private counter = signal(0); // compteur de frames > à utiliser ?
  private mainAnimationId?: number;
  private animationId?: number;
  private isRunning = false;

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

    // if (this.mainAnimationId) {
    //   cancelAnimationFrame(this.mainAnimationId);
    //   this.mainAnimationId = undefined;
    // }
    // if (this.animationId) {
    //   cancelAnimationFrame(this.animationId);
    //   this.animationId = undefined;
    // }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.robotSignals.clear();

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
        robot = this.stopMovingRobot(robot, robot.isRobotReturningToBase);
      }
    });

    // if (this.mainAnimationId) {
    //   cancelAnimationFrame(this.mainAnimationId);
    //   this.mainAnimationId = undefined;
    // }
    // if (this.animationId) {
    //   cancelAnimationFrame(this.animationId);
    //   this.animationId = undefined;
    // }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Service de robots mis en pause');
  }

  // TODO: refacto dans service robot-data
  public getRobotsParams(): RobotAspiratorModel[] {
    console.log("RobotAspiratorDataService - getRobotsParams()");

    // robot1 test
    // 1 - Récupération des datas :
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    let robotName = "Aspiroman 1";
    let basePosition = { x: 0, y: 0 };
    // au départ, le robot est à la base:
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let coordinate = { x: 0, y: 0 };
    let batterie = 50;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;

    // 2 - Instanciation du RobotAspiratorModel:
    let robot1Model = new RobotAspiratorModel();
    robot1Model.robotName = robotName;
    robot1Model.basePosition = { ...basePosition };
    robot1Model.lastPosition = { ...lastPosition };
    robot1Model.position = { ...position };
    robot1Model.coordinate = { ...coordinate };
    robot1Model.batterie = batterie;
    robot1Model.isRobotStarted = isRobotStarted;
    robot1Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot1Model);

    // robot2 test
    robotName = "Aspiroman 2";
    basePosition = { x: 9, y: 0 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    coordinate = { x: 450, y: 0 };
    batterie = 20;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.basePosition = { ...basePosition };
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.coordinate = { ...coordinate };
    robot2Model.batterie = batterie;
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot2Model);

    // robot3 test
    robotName = "Aspiroman 3";
    basePosition = { x: 9, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    coordinate = { x: 450, y: 350 };
    batterie = 30;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot3Model = new RobotAspiratorModel();
    robot3Model.robotName = robotName;
    robot3Model.basePosition = { ...basePosition };
    robot3Model.lastPosition = { ...lastPosition };
    robot3Model.position = { ...position };
    robot3Model.coordinate = { ...coordinate };
    robot3Model.batterie = batterie;
    robot3Model.isRobotStarted = isRobotStarted;
    robot3Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot3Model);

    // robot3 test
    robotName = "Aspiroman 4";
    basePosition = { x: 0, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    coordinate = { x: 0, y: 350 };
    batterie = 40;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot4Model = new RobotAspiratorModel();
    robot4Model.robotName = robotName;
    robot4Model.basePosition = { ...basePosition };
    robot4Model.lastPosition = { ...lastPosition };
    robot4Model.position = { ...position };
    robot4Model.coordinate = { ...coordinate };
    robot4Model.batterie = batterie;
    robot4Model.isRobotStarted = isRobotStarted;
    robot4Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot4Model);

    return [robot1Model, robot2Model, robot3Model, robot4Model];
//     return [robot1Model];
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
 * Déplace manuellement un robot à une position
 */
  // private updateRobotModelPosition(robotName: string, lastPosition: Position, newPosition: Position): void {
  //   console.log("RobotAspiratorDataService - moveRobot()");

  //   const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);

  //   if (robotSignal) {
  //     // Update des données du robot:
  //     robotSignal.update(robot => ({
  //       ...robot,
  //       lastPosition: { ...lastPosition },
  //       position: { ...newPosition },
  //       batterie: robot.batterie - robot.consommationParMouvement
  //     }));
  //   }
  // }

  /**
  * Arrêt d'un robot à une position
  */
  // TODO: revoir selon modifs de moveRobot
  private stopMovingRobot(robot: RobotAspiratorModel, isRobotReturningToBase: boolean): RobotAspiratorModel {
    console.log("RobotAspiratorDataService - stopMovingRobot()");

    robot.isRobotStarted = false;
    robot.lastPosition = robot.position;
    robot.isRobotReturningToBase = isRobotReturningToBase;

    console.log(`Robot ${robot.robotName} arrêté à (${robot.position.x}, ${robot.position.y}) - Batterie = (${robot.batterie})`);
    return robot;
  }

  // ************ méthodes pour l'animation des déplacements du robot (vue)

  /**
  * Lancement de l'update de la vue pour la liste de robots
  */
  // public updateAllRobotsViews(robotName: string): void {
  //   console.log('RobotAspiratorDataService - updateAllRobotsViews()');
  //   const robotModel: RobotAspiratorModel = this.getRobotModel(robotName);

  //   this.performModelUpdate(robotModel);
  // }

  // nouvelle version:
  // méthode principale de démarrage de l'animation synchronisée des robots
  public startRobotsMapInterval(maisonModel: MaisonModel): void {
    // if (this.isRunning) {
    //   console.warn('Animation déjà en cours');
    //   return;
    // }
    // this.isRunning = true;

    this.maisonModel = maisonModel;

    // const animate = (currentTime: number) => {
    // if (!this.isRunning) return;

    this.intervalId = setInterval(() => {
      this.calculateNewDirectionsForAllRobots();
      this.updateAllRobotsSmooth();
      this.updateMaisonVisitedCells();
    }, 600); // 600ms modifiable avec le CSS du robot (transition)

    // this.animationId = requestAnimationFrame(animate);
    // };

    // this.animationId = requestAnimationFrame(animate);
    // animate();
    console.log('Animation démarrée');
  }

  private updateAllRobotsSmooth(): void {
    this.robotSignals.forEach((robotSignal: WritableSignal<RobotAspiratorModel>) => {
      const robotModel: RobotAspiratorModel = robotSignal();

      if (!robotModel.isRobotStarted) return;

      // MAJ de la direction du robot (datas)
      const nextPosition = this.getRobotDirection(robotModel);

      // coordinate: utilisation de variables en px pour la vue, différente de AspiroX, qui est un index dans le tableau (maison)
      robotSignal.update(robot => ({
        ...robot,
        isRobotReturningToBase: robot.isRobotReturningToBase,
        coordinate: {
          x: robot.coordinate.x + nextPosition.x * this.MAISON_CELL_WIDTH,
          y: robot.coordinate.y + nextPosition.y * this.MAISON_CELL_WIDTH
        },
        lastPosition: { ...robot.lastPosition },
        position: { ...robot.position },
        isRobotStarted: robot.isRobotStarted,
        consommationParMouvement: robot.consommationParMouvement,
        batterie: robot.batterie - robot.consommationParMouvement
      }));

      const updatedRobot = robotSignal();
      console.log(`Robot ${updatedRobot.robotName} déplacé sur le canvas à (${updatedRobot.coordinate.x}, ${updatedRobot.coordinate.y})`);
    });
  }

  /**
 * Calcule de nouvelles directions toutes les 1000ms
 */
  private calculateNewDirectionsForAllRobots(): void {
    console.log("RobotAspiratorDataService - calculateNewDirectionsForAllRobots()");

    // Parcourt tous les robots
    this.robotSignals.forEach((robotSignal) => {

      // met à jour chaque robot
      robotSignal.update(currentRobot => {

        const robotStarted: RobotAspiratorModel = {
          ...currentRobot,
          isRobotStarted: true
        }

        // renvoyer les données du robot à sa nouvelle position du robot
        const robotWithNewPosition: RobotAspiratorModel | undefined = this.calculateRobotNextPosition(robotStarted);

        if (robotWithNewPosition) {
          return robotWithNewPosition;
        }
        return robotStarted;
      });
    });
  }

  private updateMaisonVisitedCells(): void {
    this.robotSignals.forEach((robotSignal) => {
      const robot: RobotAspiratorModel = robotSignal();
      // maj des datas de la maison: position visitée
      this.maisonService.updateMaisonCellules(robot.lastPosition);
    });
  }

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

  // TODO: juste pour tester rapido
  /**
   * Votre logique métier pour calculer le nouveau modèle
   */
  private updatedRobotCoordinateTest(robotName: string): RobotAspiratorModel {
    const current = this.robotSignals.get(robotName)?.();
    if (!current) {
      throw new Error(`Robot ${robotName} introuvable`);
    }
    // Votre logique de calcul ici
    return {
      ...current,
      coordinate: {
        x: current.coordinate.x + (Math.random() * 4 - 2),
        y: current.coordinate.y + (Math.random() * 4 - 2)
      }
    };
  }

  // mise à jour de robot (à l'unité)
  private calculateRobotNextPosition(robot: RobotAspiratorModel | undefined): RobotAspiratorModel | undefined {
    console.log("RobotAspiratorDataService - updateAllRobots()");

    if (!robot) return robot;

    // this.areRobotsInitialized.set(true);

    // Récupérer le robot mis à jour pour nettoyer
    // robot.isRobotStarted = true;

    robot.batterie = robot.batterie > 0 ? robot.batterie : 0;

    const batteryLimitExceeded: boolean = this.robotDoitRentrerALaBase(robot.batterie, robot.position, robot.basePosition, robot.consommationParMouvement);
    // TODO: revoir condition pour batterie de 1 (passer condition en cas de retour à la base)
    if (robot.batterie > 0 && batteryLimitExceeded) {
      console.log(`updateAllRobots() - Limite de batterie atteinte : le robot doit rentrer à la base - Batterie: ${robot.batterie}%`);
      this.retournerALaBase(this.maisonModel, robot);
    }
    else
      if (robot.batterie > 0 && !batteryLimitExceeded) {
        robot = this.nettoyer(this.maisonModel, robot);
        if (!robot) return robot;

        console.log(`Robot ${robot.robotName} mis à jour - Batterie: ${robot.batterie}%`);
      }
      // TODO: mise en pause par robot à l'arrivée à la base du robot : stop
      else if (robot!.position.x === robot!.basePosition.x && robot!.position.y === robot!.basePosition.y
      ) {
        robot = this.stopMovingRobot(robot, robot.isRobotReturningToBase);
      }
      else {
        console.log(`Le robot ne peut pas démarrer - Batterie: ${robot.batterie}%`);
        robot = this.stopMovingRobot(robot, robot.isRobotReturningToBase);
      }
    return robot;
  }

  private getRobotDirection(robot: RobotAspiratorModel): Position {
    console.log("RobotAspiratorDataService - setAspiroDirection()");
    const aspiroX = robot.position.x;
    const aspiroY = robot.position.y;

    // Directions du robot (Attention: c'est un index dans le tableau de la maison ici, pas la position en px)
    const aspiroDirX = (aspiroX - robot.lastPosition.x) === 1 ? 1 :
      (aspiroX - robot.lastPosition.x) === -1 ? -1 : 0;
    const aspiroDirY = (aspiroY - robot.lastPosition.y) === 1 ? 1 :
      (aspiroY - robot.lastPosition.y) === -1 ? -1 : 0;

    return new Position(aspiroDirX, aspiroDirY);
  }

  // V2: test animation précise mais plus lente (risque de décallage du robot avec les positions visitées)
  // -> pb respect algo > ne plus utiliser
  // private startDrawCanvasTimer(robotModel: RobotAspiratorModel | undefined): void {
  //   //   private startDrawCanvasTimer(robotName: string, robotCoordinate: Position): void {
  //   console.log("RobotAspiratorDataService - startDrawCanvasTimer()");

  //   if (this.isRunning) {
  //     console.warn('Animation déjà en cours');
  //     return;
  //   }

  //   if (!robotModel) return;

  //   console.log('Timer started');
  //   console.log('requestAnimationFrame existe ?', typeof requestAnimationFrame); // ✅ Devrait afficher "function"

  //   this.isRunning = true;
  //   // const startTime = performance.now();
  //   let count = 0;

  //   const animate = (currentTime: number) => {
  //     if (!this.isRunning) return; // Vérifier si l'animation doit continuer

  //     // TODO: UTILISER elapsed ??
  //     // const elapsed = currentTime - startTime;
  //     // const frame = Math.floor(elapsed);
  //     count++;
  //     // console.log(`Frame: ${frame}, Iteration: ${count}`);

  //     if (count <= 50) { // attention à setInterval() de 1000 au moins sinon retard du robot sur l'algo de déplacement
  //       this.counter.set(count); // ✅ Utiliser count au lieu de frame pour régularité

  //       // utilisation de variables en px pour la vue, différente de AspiroX, qui est un index dans le tableau (maison)
  //       robotModel.coordinate.x += this.aspiroDirX;
  //       robotModel.coordinate.y += this.aspiroDirY;

  //       // mise à jour du signal du robot à ses nouvelles coordonnées (en px)
  //       // TODO: utiliser ici ?
  //       this.performModelUpdateTest(robotModel);
  //       // this.moveRobotView(robotModel.robotName, robotModel.coordinate);

  //       this.animationId = requestAnimationFrame(animate); // ✅ Stocker l'id de l'animation
  //     } else {
  //       console.log('Animation terminée');
  //       this.stopAnimation(); // ✅ Utilise stopAnimation au lieu de ngOnDestroy
  //     }
  //   };

  //   this.animationId = requestAnimationFrame(animate);
  // }

  // V1: startDrawCanvasTimer > ne plus utiliser
  // private startDrawCanvasTimer(): void {
  //   console.log("RobotAspiratorDataService - startDrawCanvasTimer()");

  //   this.counter.set(0);

  //   this.drawCanvasInterval = interval(1)
  //     .pipe(
  //       take(50), // Prend exactement 50 valeurs (0 à 49)
  //       takeUntil(this.destroy$)
  //     )
  //     .subscribe(value => {
  //       this.counter.set(value);
  //       console.log(this.counter());
  //       this.drawCanvasElements();
  //     });
  // }

  // TODO: utiliser ??
  private stopAnimation(): void {
    console.log('Animation stopped');
    this.isRunning = false;
    if (this.animationId !== undefined) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
  }

  // ************ méthodes propres au robot Aspirateur:

  // Algo V1
  // Fonction principale pour nettoyer la maison
  private nettoyer(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): RobotAspiratorModel | undefined {
    console.log("RobotAspiratorDataService - nettoyer()");

    this.maisonModel = { ...maisonModelInput };

    // const robotName = robotModelInput.robotName;
    // const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);

    // TODO: gardé pour les différentes conditions de déplacement ou arrêt (voir si refacto nécessaire)
    // if (!robotSignal) {
    //   console.error(`Signal du robot ${robotName} introuvable`);
    //   return robotSignal;
    // }
    // Toujours récupérer la version actuelle du signal
    // let robot: RobotAspiratorModel | undefined = robotSignal();

    // si le robot revient à la base
    // if (robotModelInput.isRobotReturningToBase) {
    //   robotModelInput = this.retournerALaBase(this.maisonModel, robotModelInput);
    //   return robotModelInput;
    // }
    // si toutes les cellules accessibles sont visitées
    // ou bien: si la batterie est insuffisante pour avancer plus loin,
    // retour à la base nécessaire

    // else
    // const batteryLimitExceeded: boolean = this.robotDoitRentrerALaBase(robotModelInput.batterie, robotModelInput.position, robotModelInput.basePosition, robotModelInput.consommationParMouvement);
    // if (this.toutEstNettoye() || batteryLimitExceeded) {
    //   console.log("nettoyer() - Tout est nettoyer, ou bien batterie insuffisante pour aller plus loin");
    //   robotModelInput = this.retournerALaBase(this.maisonModel, robotModelInput);
    //   return robotModelInput;
    // }

    // Chercher la prochaine cellule non visitée et s'y diriger
    const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.maisonModel.maison, robotModelInput.position);
    console.log(prochaineCellule);

    if (!prochaineCellule) {
      // Si aucune cellule n'est trouvée, retourner à la base
      console.log("Aucune cellule accessible non visitée trouvée");
      // Mise à jour des données du robot avec un Signal dans un service Singleton (équivalent d'un setter)
      robotModelInput = this.retournerALaBase(this.maisonModel, robotModelInput);
      // robotModelInput = this.stopMovingRobot(robotModelInput, true);
      return robotModelInput;
    }
    // TODO: revoir - effet de bord de setInterval nous ramène ici ?
    else {
      // Utiliser A* ou un autre algorithme de recherche de chemin pour trouver le chemin optimal
      const nextPosition: Position = this.cheminOptimalService.trouverPositionSuivante(this.maisonModel.maison, robotModelInput.position, prochaineCellule.cellStack[0].position);
      // console.log("nextPosition :" + nextPosition);

      if (nextPosition === undefined) {
        console.log("Impossible de trouver un chemin vers la destination");
        return robotModelInput;
      }
      // ** Dans cette version de l'algo: on prend la première position du chemin à chaque tour de boucle
      if (this.toutEstNettoye() || this.robotDoitRentrerALaBase(robotModelInput.batterie, nextPosition, robotModelInput.basePosition, robotModelInput.consommationParMouvement)) {
        console.log("Batterie insuffisante pour aller plus loin");

        robotModelInput = this.retournerALaBase(this.maisonModel, robotModelInput);
        return robotModelInput;
      }

      robotModelInput = this.deplacer(robotModelInput, nextPosition);
    }
    return robotModelInput;
  }

  // algo V1
  // Retourner à la base de charge
  private retournerALaBase(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): RobotAspiratorModel {
    console.log("RobotAspiratorDataService - retournerALaBase()");
    console.log("Retour à la base de charge");

    this.maisonModel = maisonModelInput;

    // Trouver le chemin vers la base
    const nextPosition: Position = this.cheminOptimalService.trouverPositionSuivante(this.maisonModel.maison, robotModelInput.position, robotModelInput.basePosition);
    console.log("nextPosition :" + nextPosition);

    if (nextPosition === undefined) {
      console.log("Impossible de trouver un chemin vers la base de charge!");
      robotModelInput = this.stopMovingRobot(robotModelInput, robotModelInput.isRobotReturningToBase);
      return robotModelInput;
    } else {
      // Suivre le chemin
      robotModelInput = this.deplacer(robotModelInput, nextPosition);
    }
    return robotModelInput;
  }


  // V1 :
  // Déplacer le robot à une position spécifique
  private deplacer(robot: RobotAspiratorModel, nextPosition: Position): RobotAspiratorModel {
    console.log("RobotAspiratorDataService - deplacer()");

    // TODO: utiliser encore ??
    if (robot.isRobotStarted === false) {
      robot = this.stopMovingRobot(robot, false);
      return robot;
    }
    else if (this.robotDoitRentrerALaBase(robot.batterie, nextPosition, robot.basePosition, robot.consommationParMouvement)) {
      console.log("Le robot ne peut aller plus loin : batterie insuffisante. Activation du retour à la base !");
      robot = this.stopMovingRobot(robot, true);
      RobotAspiratorModel.logger(robot);

      return robot;
    }

    // Mettre à jour le robot à sa nouvelle position:
    // Mise à jour des données du robot avec un Signal dans un service Singleton
    robot.lastPosition = { ...robot.position };
    robot.position = { ...nextPosition };

    console.log(`Robot ${robot.robotName} déplacé de (${robot.lastPosition.x}, ${robot.lastPosition.y}) à (${robot.position.x},
        ${robot.position.y}) - Batterie: (${robot.batterie.toFixed(1)})%`);
    return robot;
  }

  // TODO: refacto dans service algo ?
  private robotDoitRentrerALaBase(batterie: number, position: Position, basePosition: Position, consommationParMouvement: number): boolean {
    console.log("RobotAspiratorDataService - robotMustStop()");

    return (position && batterie <= this.energieNecessairePourRetour(position, basePosition, consommationParMouvement)) ?
      true : false;
  }

  // TODO: refacto dans service algo ?
  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(position: Position, basePosition: Position, consommationParMouvement: number): number {
    console.log("RobotAspiratorDataService - energieNecessairePourRetour()");

    // Estimer la distance jusqu'à la base
    const distance = this.cheminOptimalService.distance(position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité si on veut
    return (distance * consommationParMouvement) * 1;
  }

  // TODO: refacto dans service algo ?
  // Vérifier si toutes les cellules accessibles ont été visitées
  private toutEstNettoye(): boolean {
    console.log("RobotAspiratorDataService - toutEstNettoye()");

    for (let i = 0; i < this.maisonModel.maison.length; i++) {
      for (let j = 0; j < this.maisonModel.maison[i].length; j++) {
        const cell: Cell = this.maisonModel.maison[i][j];
        if (cell.cellStack[0].type !== 'X' && cell.cellStack[0].type !== 'B' && !cell.cellStack[0].visited) {
          return false;
        }
      }
    }
    return true;
  }

  // TODO: revoir CSS de la maison si on affiche les logs dans l'ihm
  private log(message: string) {
    this.messageService.add(`RobotAspiratorBService: ${message}`);
  }
}
