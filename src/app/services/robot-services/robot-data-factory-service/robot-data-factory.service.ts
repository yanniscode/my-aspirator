import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model/robot-model';
import { RobotAspiratorDataService } from '../robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { RobotDataService } from '../robot-data-services/robot-data.service';
import { RobotAspiromanDataService } from '../robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';

@Injectable({
  providedIn: 'root',
})
export class RobotDataFactoryService {

  private robotDataService = inject(RobotDataService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);
  private robotAspiromanDataService = inject(RobotAspiromanDataService);

  // Pattern factory: tableau de Robot Data Services de type spécifiques vers un type générique
  private robotDataServicesTab: RobotDataService[] = [this.robotAspiratorDataService, this.robotAspiromanDataService];

  /**
  * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  */
  public readonly robotSignals: Map<string, Signal<RobotModel>> = this.robotDataService.robotSignals;

  public getRobotSignal(robotName: string): Signal<RobotModel | undefined> {
    return this.robotDataService.getRobotSignal(robotName);
  }

  /**
   * computed vérifiant si la map de robots est à l'état démarré
   * note: fonctionne ici, mais pas si on la place dans RobotDataService
   */
  public readonly hasActiveRobots: Signal<boolean> = computed(() =>
    [...this.robotSignals.values()].some(signal => signal()?.isRobotStarted)
    // ou si l'on veut filtrer par type de robot:
    // [...this._robotSignals.values()].some(signal => (signal()?.robotType === "player") && signal()?.isRobotStarted)
  );

  // Récupération du Signal pour le progress (0 à 1) synchronisé des bots
  public animationBotsProgSignal: WritableSignal<number> = signal(-1);
  // Récupération de la Map de Signaux pour le progress (0 à 1) des joueurs
  public animationPlayerProgSignals: Map<string, WritableSignal<number>> = new Map<string, WritableSignal<number>>();

  constructor() {
    console.log("RobotDataFactoryService - constructor()");

    // Instanciation des signaux de la progression de l'animation des robots de tout type
    this.buildRobotsAnimProgSignalsList();
  }

  /**
   * Méthode de factory : renvoie les paramètres des robots avec un upcast vers le type générique RobotModel[]
   */
  public createRobotsParams(): void {
    console.log("RobotDataFactoryService - createRobotsParams()");

    // initialisation des paramètres des robots
    let robotModelsTab: RobotModel[] = [];

    this.robotDataServicesTab.forEach(robotDataService => {
      robotDataService.createRobotsParams().map(robot => {
        robotModelsTab.push(robot);
      });
    });

    // initialisation de la Map de signaux
    this.buildRobotSignalsList();
  }

  /**
   * Méthode de factory qui récupère les signaux des robots dans une liste (pour synchroniser les données)
   *
   * @returns
   */
  public buildRobotSignalsList(): void {
    console.log("RobotDataFactoryService - buildRobotSignalsList()");

    this.robotDataServicesTab.forEach(robotDataService => {
      robotDataService.getRobotSignalsList().forEach(robotSignal => {
        this.robotSignals.set(robotSignal().robotName, robotSignal as WritableSignal<RobotModel>);

        if (robotSignal().robotType === "player") {
          this.animationPlayerProgSignals.set(robotSignal().robotName, signal(0));
        }
      });
    });
  }

  /**
  * Nettoye la map générique de signaux
  */
  public clearAllRobotsList(): void {
    console.log("RobotDataFactoryService - clearAllRobotsList()");
    this.robotDataService.clearAllRobotsList();
  }

  /**
   * Instanciation des signaux de la progression de l'animation à partir du type générique RobotDataService en non du type spécifique des robots
   * (comme on est dans une Factory)
   */
  private buildRobotsAnimProgSignalsList(): void {
    console.log("RobotDataFactoryService - buildRobotsAnimProgSignalsList()");

    this.robotDataServicesTab.forEach(robotDataService => {
      let robotAspiratorDataService: RobotAspiratorDataService;
      let robotAspiromanDataService: RobotAspiromanDataService;

      // Instanciation du signal de progression de l'animation individualisé des bots:
      if (robotDataService.serviceName === "RobotAspiratorDataService") {
        robotAspiratorDataService = robotDataService as RobotAspiratorDataService;
        this.animationBotsProgSignal = robotAspiratorDataService._animationBotsProgSignal;
      }
      // Instanciation des signaux de progression de l'animation individualisés pour chaque robot joueur:
      if (robotDataService.serviceName === "RobotAspiromanDataService") {
        robotAspiromanDataService = robotDataService as RobotAspiromanDataService;
        this.animationPlayerProgSignals = robotAspiromanDataService._animationPlayerProgSignals;
      }
    });
  }
}
