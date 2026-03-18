import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { DataFactoryService } from '../data-factory.service';
import { RobotModel } from '../../../classes/models/robot-model';
import { RobotAspiratorDataService } from '../../data-services/robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { RobotDataService } from '../../data-services/robot-data-services/robot-data.service';

@Injectable({
  providedIn: 'root',
})
export class RobotDataFactoryService extends DataFactoryService {

  private robotDataService = inject(RobotDataService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  public robotNames = signal<string[]>([]);

  /**
   * Méthode de factory qui renvoie les paramètres de la liste de robots d'un type spécifique vers un type générique
   *
   * initialisation des robots de type Aspirateur ou d'autres types possible ici:
   *
   * @returns
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
   * Méthode qui enregistre les signaux des robots dans une liste de type générique
   * @param robotModelTab
   * @returns
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
