import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model';
import { RobotAspiratorDataService } from '../robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { RobotDataService } from '../robot-data-services/robot-data.service';

@Injectable({
  providedIn: 'root',
})
export class RobotDataFactoryService {

  private robotAspiratorDataService = inject(RobotAspiratorDataService);
  private robotDataService = inject(RobotDataService);

  public robotNames = signal<string[]>([]);

  /**
   * Méthode de factory : renvoie les paramètres des robots avec un upcast vers le type générique RobotModel[]
   */
  public getRobotsParams(TYPE_ACTION_ROBOT: string): RobotModel[] {
    console.log("RobotDataFactoryService - getRobotsParams()");

    // pattern "factory": upcast du type enfant RobotAspiratorModel vers le type parent RobotModel
    if (TYPE_ACTION_ROBOT === "aspirator") {
      return [...this.robotAspiratorDataService.createRobotsParams()];
    } else {
      return [];
    }
  }

  /**
   * Méthode de factory qui enregistre les signaux des robots dans une liste (pour synchroniser les données)
   *
   * @param robotModel
   */
  public setRobotSignalsList(robotModelTab: RobotModel[]): WritableSignal<string[]> {
    console.log("RobotDataFactoryService - setRobotSignalsList()");

    robotModelTab.forEach((robotModel: RobotModel) => {
      // 1/ ajout du robot dans le type générique RobotModel à la liste:
      const robotAspiratorModel: RobotModel = { ...robotModel };
      this.robotDataService.registerRobotInList(robotAspiratorModel);

      // 2/ enregistrer le nom de chaque robot dans la liste de robotNames pour le template binding:
      this.robotNames.update(robotNames => [...robotNames, robotModel.robotName]);
    });

    return this.robotNames;
  }
}
