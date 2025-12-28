import { inject, Injectable, OnDestroy, Signal, signal, WritableSignal } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';
import { Position } from '../../classes/models/position';
import { Cell } from '../../classes/models/cell';
import { MessageService } from '../message-service/message.service';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorDataService implements OnDestroy {

  private messageService: MessageService;
  private cheminOptimalService: CheminOptimalService;

  // Signal en lecture seule pour l'extérieur du service
  private readonly robotSignals = new Map<string, WritableSignal<RobotAspiratorModel>>();

  private maisonModel: MaisonModel;

  private intervalId?: number;

  constructor() {
    console.log("RobotAspiratorDataService - constructor()");

    this.messageService = inject(MessageService);
    this.cheminOptimalService = inject(CheminOptimalService);

    this.maisonModel = new MaisonModel();
  }

  /**
  * Nettoyage complet du service
  */
  ngOnDestroy(): void {
    console.log("RobotAspiratorDataService - ngOnDestroy()");

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.robotSignals.clear();
    console.log('Service de robots arrêté');
  }

  // TODO: refacto dans service robot-data
  public getRobotsParams(): RobotAspiratorModel[] {
    console.log("RobotAspiratorDataService - getRobotsParams()");

    // robot1 test
    // 1 - Récupération des datas :
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    let robotName = "robot1";
    let basePosition = { x: 0, y: 0 };
    // au départ, le robot est à la base:
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let batterie = 50;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;

    // 2 - Instanciation du RobotAspiratorModel:
    let robot1Model = new RobotAspiratorModel();
    robot1Model.robotName = robotName;
    robot1Model.basePosition = { ...basePosition };
    // au départ, le robot est à la base:
    robot1Model.lastPosition = { ...lastPosition };
    robot1Model.position = { ...position };
    robot1Model.batterie = batterie;
    robot1Model.isRobotStarted = isRobotStarted;
    robot1Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot1Model);

    // robot2 test
    robotName = "robot2";
    basePosition = { x: 9, y: 0 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 60;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.basePosition = { ...basePosition };
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.batterie = batterie;
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot2Model);

    // robot3 test
    robotName = "robot3";
    basePosition = { x: 9, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 20;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot3Model = new RobotAspiratorModel();
    robot3Model.robotName = robotName;
    robot3Model.basePosition = { ...basePosition };
    robot3Model.lastPosition = { ...lastPosition };
    robot3Model.position = { ...position };
    robot3Model.batterie = batterie;
    robot3Model.isRobotStarted = isRobotStarted;
    robot3Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot3Model);

    // robot3 test
    robotName = "robot4";
    basePosition = { x: 0, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 10;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot4Model = new RobotAspiratorModel();
    robot4Model.robotName = robotName;
    robot4Model.basePosition = { ...basePosition };
    robot4Model.lastPosition = { ...lastPosition };
    robot4Model.position = { ...position };
    robot4Model.batterie = batterie;
    robot4Model.isRobotStarted = isRobotStarted;
    robot4Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot4Model);

    // return [robot1Model, robot2Model, robot3Model, robot4Model];
    return [robot1Model, robot2Model, robot3Model];
  }

  public startRobotsMapInterval(maisonModel: MaisonModel): void {
    console.log("RobotAspiratorDataService - startGlobalInterval()");

    this.maisonModel = maisonModel;

    this.intervalId = window.setInterval(() => {
      // Version Map de robots
      this.updateAllRobots();
    }, 500);
  }

  // mise à jour de la map() de robots:
  private updateAllRobots(): void {
    console.log("RobotAspiratorDataService - updateAllRobots()");
    console.log(this.robotSignals);

    this.robotSignals.forEach((robotSignal: WritableSignal<RobotAspiratorModel>) => {
      // Mettre à jour isRobotStarted et décrémenter la batterie
      robotSignal.update(robot => ({
        ...robot,
        isRobotStarted: true,
        // batterie: robot.batterie > 0 ? robot.batterie - robot.consommationParMouvement : 0
      }));

      // Récupérer le robot mis à jour pour nettoyer
      const robot: RobotAspiratorModel = robotSignal();

      // TODO: garder condition ici ??
      if (robot.batterie > 0) {
        this.nettoyer(this.maisonModel, robot);

        console.log(`Robot ${robot.robotName} mis à jour - Batterie: ${robot.batterie}%`);
      } else {
        console.log(`Le robot ne peut pas démarrer - Batterie: ${robot.batterie}%`);
        robot.isRobotStarted = false;
        // this.onRobotPause();
      }

      // TODO: condition sur arrivée à la base du robot : stop
      if (robot.position.x === robot.basePosition.x && robot.position.y === robot.basePosition.y
      ) {
        robot.isRobotStarted = false;
        this.stopMovingRobot(robot.robotName, robot.position, robot.isRobotReturningToBase);
        // this.robotPauseV1();
      }
    });
  }

  /**
  * Enregistre un nouveau robot dans la liste avec une position initiale
  */
  public registerRobotInList(robotModel: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - registerRobotInList()");

    if (!this.robotSignals.has(robotModel.robotName)) {
      this.robotSignals.set(robotModel.robotName, signal<RobotAspiratorModel>({
        robotName: robotModel.robotName,
        basePosition: {
          x: robotModel.basePosition.x,
          y: robotModel.basePosition.y
        },
        lastPosition: {
          x: robotModel.lastPosition.x,
          y: robotModel.lastPosition.y
        },
        position: {
          x: robotModel.position.x,
          y: robotModel.position.y
        },
        batterie: robotModel.batterie,
        consommationParMouvement: robotModel.consommationParMouvement,
        isRobotStarted: robotModel.isRobotStarted,
        isRobotReturningToBase: robotModel.isRobotReturningToBase
      }));
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

  /**
   * Retourne le signal readonly du robot pour la réactivité
   */
  public getRobotSignal(robotName: string): Signal<RobotAspiratorModel> | undefined {
    console.log("RobotAspiratorDataService - getRobotSignal()");

    const robotSignal = this.robotSignals.get(robotName);
    return robotSignal?.asReadonly();
  }

  /**
  * Lecture directe (non-réactive) de l'état actuel du robot
  */
  public getRobot(robotName: string): RobotAspiratorModel {
    console.log("RobotAspiratorDataService - getRobot()");

    const signal = this.robotSignals.get(robotName);
    return signal ? signal() : new RobotAspiratorModel();
  }

  /**
 * Déplace manuellement un robot à une position
 */
  private moveRobot(robotName: string, lastPosition: Position, newPosition: Position): void {
    console.log("RobotAspiratorDataService - moveRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);
    if (robotSignal) {
      // Update des données du robot:
      robotSignal.update(robot => ({
        ...robot,
        lastPosition: { x: lastPosition.x, y: lastPosition.y },
        position: { x: newPosition.x, y: newPosition.y },
        batterie: robot.batterie - robot.consommationParMouvement
      }));

      const updatedRobot: RobotAspiratorModel = robotSignal();
      console.log(`Robot ${robotName} déplacé de (${updatedRobot.lastPosition.x}, ${updatedRobot.lastPosition.y}) à (${updatedRobot.position.x},
        ${updatedRobot.position.y}) - Batterie = (${updatedRobot.batterie})`);
      console.log(this.robotSignals);
    }
  }

  /**
  * Arrêt d'un robot à une position
  */
  // TODO: revoir selon modifs de moveRobot
  private stopMovingRobot(robotName: string, position: Position, isRobotReturningToBase: boolean): void {
    console.log("RobotAspiratorDataService - stopMovingRobot()");

    const robotSignal = this.robotSignals.get(robotName);
    if (robotSignal) {
      const robot = robotSignal();
      robotSignal.set({
        ...robot,
        lastPosition: position,
        isRobotReturningToBase: isRobotReturningToBase
      });
      console.log(`Robot ${robotName} arrêté à (${position.x}, ${position.y}) - Batterie = (${robot.batterie})`);
    }
  }

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

  // Algo V1
  // Fonction principale pour nettoyer la maison
  public nettoyer(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - nettoyer()");

    this.maisonModel = maisonModelInput;

    const robotName = robotModelInput.robotName;
    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);

    if (!robotSignal) {
      console.error(`Signal du robot ${robotName} introuvable`);
      return;
    }

    // Toujours récupérer la version actuelle du signal
    let robot: RobotAspiratorModel = robotSignal();

    // si le robot revient à la base
    if (robot.isRobotReturningToBase) {
      this.retournerALaBase(maisonModelInput, robotModelInput);
      return;
    }
    // si toutes les cellules accessibles sont visitées
    // ou bien: si la batterie est insuffisante pour avancer plus loin,
    // retour à la base nécessaire
    else if (this.toutEstNettoye() || this.robotDoitRentrerALaBase(robot.batterie, robot.position, robot.basePosition, robot.consommationParMouvement)) {
      console.log("Tout est nettoyer, ou bien batterie insuffisante pour aller plus loin");

      // Mise à jour des données du robot avec un Signal dans un service Singleton (équivalent d'un setter)
      this.stopMovingRobot(robot.robotName, robot.position, true);
      return;
    }

    // Chercher la prochaine cellule non visitée et s'y diriger
    const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.maisonModel.maison, robot.position);
    console.log(prochaineCellule);

    if (!prochaineCellule) {
      // Si aucune cellule n'est trouvée, retourner à la base
      console.log("Aucune cellule accessible non visitée trouvée");
      // Mise à jour des données du robot avec un Signal dans un service Singleton (équivalent d'un setter)
      this.stopMovingRobot(robot.robotName, robot.position, true);
      return;
    }
    // TODO: revoir - effet de bord de setInterval nous ramène ici ?
    else {
      // Utiliser A* ou un autre algorithme de recherche de chemin pour trouver le chemin optimal
      const nextPosition: Position = this.cheminOptimalService.trouverPositionSuivante(this.maisonModel.maison, robot.position, prochaineCellule.cellStack[0].position);
      // console.log("nextPosition :" + nextPosition);

      if (nextPosition === undefined) {
        console.log("Impossible de trouver un chemin vers la destination");
        return;
      }
      // ** Dans cette version de l'algo: on prend la première position du chemin à chaque tour de boucle

      this.deplacer(robot.robotName, nextPosition);
    }
  }

  // algo V1
  // Retourner à la base de charge
  public retournerALaBase(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): void {
    console.log("RobotAspiratorDataService - retournerALaBase()");

    this.maisonModel = maisonModelInput;

    const robotName = robotModelInput.robotName;
    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this.robotSignals.get(robotName);

    if (!robotSignal) {
      console.error(`Signal du robot ${robotName} introuvable`);
      return;
    }

    // Toujours récupérer la version actuelle du signal
    let robot: RobotAspiratorModel = robotSignal();

    // intervalle pour réactualiser le chemin et la position
    console.log("Retour à la base de charge");

    // Trouver le chemin vers la base
    const nextPosition: Position = this.cheminOptimalService.trouverPositionSuivante(this.maisonModel.maison, robot.position, robot.basePosition);
    console.log("nextPosition :" + nextPosition);

    if (nextPosition === undefined) {
      console.log("Impossible de trouver un chemin vers la base de charge!");
      return;
    } else {
      // Suivre le chemin
      this.deplacer(robot.robotName, nextPosition);
    }
  }


  // V1 :
  // Déplacer le robot à une position spécifique
  private deplacer(robotName: string, nextPosition: Position): void {
    console.log("RobotAspiratorDataService - deplacer()");

    const robotSignal = this.robotSignals.get(robotName);

    if (!robotSignal) {
      console.error(`Signal du robot ${robotName} introuvable`);
      return;
    }

    // Toujours récupérer la version actuelle
    const robot = robotSignal();

    // nécessaire vérification de isRobotStarted dans la fonction synchrone appelée par une observable,
    // pour éviter de nouveaux tours de boucle à cause de la présence de setInterval() dans la fonction nettoyer()
    // TODO: garder avec signaux ?? simplifier conditions ?
    if (robot.isRobotStarted === false) {
      // TODO: utiliser méthode stopMovingRobot ??
      // TODO: utiliser false / true ??
      // this.stopMovingRobot(robot.robotName, robot.position, false);
      return;
    }
    else if (this.robotDoitRentrerALaBase(robot.batterie, nextPosition, robot.basePosition, robot.consommationParMouvement)) {
      console.log("Le robot ne peut aller plus loin : batterie insuffisante. Activation du retour à la base !");
      // activation du retour à la base:
      // Mettre à jour le signal pour activer le retour à la base
      robotSignal.update(robot => ({
        ...robot,
        isRobotReturningToBase: true
      }));

      RobotAspiratorModel.logger(robot);

      this.stopMovingRobot(robot.robotName, robot.position, true);
      return;
    }
    // Mettre à jour le robot à sa nouvelle position:
    // TODO: setter déplacement:
    // Mise à jour des données du robot avec un Signal dans un service Singleton
    this.moveRobot(robot.robotName, robot.position, nextPosition);

    console.log(`Déplacement vers (${robot.position.x}, ${robot.position.y}). Batterie: ${robot.batterie.toFixed(1)}%`);
  }

  // TODO: méthode de pause - obso ??
  // public onRobotPause() {
  //   this.stopMoving();
  //   return;
  // }

  /**
* Nettoyage complet du service
*/
  onRobotPause(): void {
    console.log("RobotAspiratorDataService - onRobotPause()");

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Service de robots mis en pause');
  }

  // TODO: refacto dans service algo ?
  private robotDoitRentrerALaBase(batterie: number, position: Position, basePosition: Position, consommationParMouvement: number): boolean {
    console.log("RobotAspiratorDataService - robotMustStop()");

    return (position && batterie <= this.energieNecessairePourRetour(position, basePosition, consommationParMouvement)) ?
      true : false;
  }
  // TODO: refacto dans service algo ?
  // V2
  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(position: Position, basePosition: Position, consommationParMouvement: number): number {
    console.log("RobotAspiratorDataService - energieNecessairePourRetour()");

    // Estimer la distance jusqu'à la base
    const distance = this.cheminOptimalService.distance(position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité
    return (distance * consommationParMouvement) * 1;
  }

  // TODO: refacto dans service algo ?
  // V2
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
