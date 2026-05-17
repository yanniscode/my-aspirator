import { computed, inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model/robot-model';
import { RobotAspiratorDataService } from '../robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { RobotDataService } from '../robot-data-services/robot-data.service';
import { RobotAspiromanDataService } from '../robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';

@Injectable({
  providedIn: 'root',
})
export class RobotDataFactoryService {

  private robotDataService = inject(RobotDataService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService) as RobotDataService;
  private robotAspiromanDataService = inject(RobotAspiromanDataService) as RobotDataService;

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
    // [...this._robotSignals.values()].some(signal => (signal()?.robotType === "aspiroman") && signal()?.isRobotStarted)
  );

  public animationProgress: WritableSignal<number> = this.robotDataService.animationProgress;

  public animationPlayer1Progress: WritableSignal<number> = this.robotDataService.animationPlayer1Progress;
  public animationPlayer2Progress: WritableSignal<number> = this.robotDataService.animationPlayer2Progress;

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
      });
    });
  }

  /**
  * Désenregistre un robot et nettoie son signal
  */
  public clearAllRobotsList(): void {
    console.log("RobotDataFactoryService - clearAllRobotsList()");
    this.robotDataService.clearAllRobotsList();
  }
}
