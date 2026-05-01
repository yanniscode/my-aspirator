import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
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

  public robotNames = signal<string[]>([]);

  /**
  * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  */
  public robotSignals: Map<string, Signal<RobotModel>> = this.robotDataService.robotSignals;

  public getRobotSignal(robotName: string): Signal<RobotModel | undefined> {
    return this.robotDataService.getRobotSignal(robotName);
  }

  public hasActiveRobots(): Signal<boolean> {
    return this.robotDataService.hasActiveRobots;
  }

  /**
   * Méthode de factory : renvoie les paramètres des robots avec un upcast vers le type générique RobotModel[]
   */
  public createRobotsParams(): RobotModel[] {
    console.log("RobotDataFactoryService - createRobotsParams()");

    let robotModelsTab: RobotModel[] = [];
    for (let i = 0; i < this.robotDataServicesTab.length; i++) {
      [...this.robotDataServicesTab[i].createRobotsParams()].map(robot => {
        robotModelsTab.push(robot);
      });
    }

    return robotModelsTab;
  }

  /**
   * Méthode de factory qui récupère les signaux des robots dans une liste (pour synchroniser les données)
   *
   * @returns
   */
  public buildRobotSignalsList(): void {
    console.log("RobotDataFactoryService - buildRobotSignalsList()");

    for (let i = 0; i < this.robotDataServicesTab.length; i++) {
      this.robotDataServicesTab[i].getRobotSignalsList().forEach(robotSignal => {
        this.robotSignals.set(robotSignal().robotName, robotSignal as WritableSignal<RobotModel>);
      });
    }
  }

  /**
  * Désenregistre un robot et nettoie son signal
  */
  public clearAllRobotsList(robotName: string): void {
    console.log("RobotDataFactoryService - clearAllRobotsList()");
    this.robotDataService.clearAllRobotsList(robotName);
  }
}
