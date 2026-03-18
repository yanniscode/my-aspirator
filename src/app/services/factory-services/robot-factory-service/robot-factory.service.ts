import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { FactoryService } from '../factory.service';
import { RobotModel } from '../../../classes/models/robot-model';
import { RobotAspiratorDataService } from '../../data-services/robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { RobotDataService } from '../../data-services/robot-data-services/robot-data.service';
import { RobotAnimationService } from '../../graphic-services/animation-service/robot-animation-service/robot-animation.service';

@Injectable({
  providedIn: 'root',
})
export class RobotFactoryService extends FactoryService {

  private robotDataService = inject(RobotDataService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);
  private robotAnimationService = inject(RobotAnimationService);

  public robotNames = signal<string[]>([]);

  private ctx!: CanvasRenderingContext2D;

  /**
   * Méthode de factory qui renvoie les paramètres de la liste de robots d'un type spécifique vers un type générique
   *
   * initialisation des robots de type Aspirateur ou d'autres types possible ici:
   *
   * @returns
   */
  public getRobotsParams(TYPE_ACTION_ROBOT: string): RobotModel[] {
    console.log("RobotFactoryService - getRobotsParams()");

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
    console.log("RobotFactoryService - setRobotSignalsList()");

    robotModelTab.forEach((robotModel: RobotModel) => {
      // 1/ ajout du robot dans le type générique RobotModel à la liste:
      const robotAspiratorModel: RobotModel = { ...robotModel };
      this.robotDataService.registerRobotInList(robotAspiratorModel);

      // 2/ enregistrer le nom de chaque robot dans la liste de robotNames pour le template binding:
      this.robotNames.update(robotNames => [...robotNames, robotModel.robotName]);
    });

    return this.robotNames;
  }

  /**
   * déclenche le type d'animation souhaité
   */
  public declencheAnimationService(TYPE_ACTION_ROBOT: string, ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("RobotFactoryService - setRobotListSignals()");
    this.ctx = ctx;

    if (TYPE_ACTION_ROBOT === "aspirator") {
      console.log("déclenchement de l'animation du robot Aspirateur");
      this.ctx = this.robotAnimationService.startRobotsAnimation(ctx);
    }

    return this.ctx;
  }

  /**
   * met en pause selon le type d'animation souhaité
   */
  public pauseAnimationService(TYPE_ACTION_ROBOT: string, ctx: CanvasRenderingContext2D): void {
    console.log("RobotFactoryService - setRobotListSignals()");

    if (TYPE_ACTION_ROBOT === "aspirator") {
      console.log("déclenchement de l'animation du robot Aspirateur");
      this.robotAnimationService.onRobotsPause(ctx);
    }
  }
}
