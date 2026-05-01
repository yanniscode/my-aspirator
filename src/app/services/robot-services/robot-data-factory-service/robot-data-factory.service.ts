import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
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
  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>> = new Map<string, WritableSignal<RobotModel>>();
  public robotSignals: Map<string, WritableSignal<RobotModel>> = this._robotSignals;

  /**
   *
   *  Lecture directe (non-réactive) de l'état actuel du robot
   *  Retourne le signal readonly du robot
   *
   * @param robotName
   * @returns
   */
  public getRobotSignal(robotName: string): Signal<RobotModel | undefined> {
    console.log("RobotDataService - getRobotSignal()");

    const writableSignal: WritableSignal<RobotModel> | undefined = this._robotSignals.get(robotName);
    return writableSignal?.asReadonly() ?? signal(undefined);
  }

  // computed vérifiant si la map de robots un un robot "aspiroman" est à l'état démarré
  public readonly hasActiveRobots = computed(() =>
    [...this._robotSignals.values()].some(signal => signal()?.isRobotStarted)
    // ou si l'on veut filtrer par type de robot:
    // [...this._robotSignals.values()].some(signal => (signal()?.robotType === "aspiroman") && signal()?.isRobotStarted)
  );

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
  public buildRobotSignalsList(): Map<string, Signal<RobotModel>> {
    console.log("RobotDataFactoryService - buildRobotSignalsList()");

    for (let i = 0; i < this.robotDataServicesTab.length; i++) {
      this.robotDataServicesTab[i].getRobotSignalsList().forEach(robotSignal => {
        this.robotSignals.set(robotSignal().robotName, robotSignal as WritableSignal<RobotModel>);
      });
    }
    return this.robotSignals;
  }

  // TODO: revoir
  // /**
  // * Désenregistre un robot et nettoie son signal
  // */
  // public unregisterRobotFromList(robotName: string): void {
  //   console.log("RobotDataFactoryService - unregisterRobotFromList()");
  //   this.robotDataService.unregisterRobotFromList(robotName);
  // }
}
