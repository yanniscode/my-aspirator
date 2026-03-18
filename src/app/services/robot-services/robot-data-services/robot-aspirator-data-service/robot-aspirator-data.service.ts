import { inject, Injectable } from '@angular/core';
import { RobotDataService as RobotDataService } from '../robot-data.service';
import { RobotAspiratorModel } from '../../../../classes/models/robot-aspirator-model';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../logger-service/logger.service';
import { RobotActionAspiratorService } from '../../robot-action-services/robot-action-aspirator-service/robot-action-aspirator.service';
import { AssetRobotService } from '../../robot-graphics-services/asset-robot-service/asset-robot.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiratorDataService extends RobotDataService {

  private robotActionAspiratorService = inject(RobotActionAspiratorService);
  private assetRobotService = inject(AssetRobotService);
  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  private loggerService = inject(LoggerService);

  constructor() {
    console.log("RobotAspiratorDataService - constructor");
    super();
  }

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  // appelée par MainComponent
  public override createRobotsParams(): RobotAspiratorModel[] {
    console.log("RobotAspiratorDataService - createRobotsParams()");

    // 1 - Récupération des datas :

    // robot1 test
    let robotName = "Aspiroman 1";
    let robotType = "aspirator";
    let basePosition = new GridPosition(0, 0);
    // au départ, le robot est à la base:
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let startCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    let targetCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    let batterie = 4.5;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;
    let robotWidth = 50;
    let labelColor = this.assetRobotService.getRandomRobotLabelColor();

    // 2 - Instanciation d'un robot:
    let robot1Model = new RobotAspiratorModel();
    robot1Model.robotName = robotName;
    robot1Model.robotType = robotType;
    robot1Model.basePosition = { ...basePosition };
    robot1Model.lastPosition = { ...lastPosition };
    robot1Model.position = { ...position };
    robot1Model.startCoordinate = { ...startCoordinate };
    robot1Model.targetCoordinate = { ...targetCoordinate };
    robot1Model.batterie = batterie;
    robot1Model.isRobotStarted = isRobotStarted;
    robot1Model.isRobotReturningToBase = isRobotReturningToBase;
    robot1Model.robotWidth = robotWidth;
    robot1Model.labelColor = labelColor;

    console.log(robot1Model);

    // robot2 test
    robotName = "Aspiroman 2";
    robotType = "aspirator";
    basePosition = new GridPosition(0, 9);
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    targetCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    batterie = 20;
    isRobotStarted = false;
    isRobotReturningToBase = false;
    robotWidth = 50;
    labelColor = this.assetRobotService.getRandomRobotLabelColor();

    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.robotType = robotType;
    robot2Model.basePosition = { ...basePosition };
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.startCoordinate = { ...startCoordinate };
    robot2Model.targetCoordinate = { ...targetCoordinate };
    robot2Model.batterie = batterie;
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;
    robot2Model.labelColor = labelColor;
    robot2Model.robotWidth = robotWidth;

    console.log(robot2Model);

    // robot3 test
    robotName = "Aspiroman 3";
    robotType = "aspirator";
    basePosition = new GridPosition(7, 9);
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    targetCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    batterie = 30;
    isRobotStarted = false;
    isRobotReturningToBase = false;
    robotWidth = 50;
    labelColor = this.assetRobotService.getRandomRobotLabelColor();

    let robot3Model = new RobotAspiratorModel();
    robot3Model.robotName = robotName;
    robot3Model.robotType = robotType;
    robot3Model.basePosition = { ...basePosition };
    robot3Model.lastPosition = { ...lastPosition };
    robot3Model.position = { ...position };
    robot3Model.startCoordinate = { ...startCoordinate };
    robot3Model.targetCoordinate = { ...targetCoordinate };
    robot3Model.batterie = batterie;
    robot3Model.isRobotStarted = isRobotStarted;
    robot3Model.isRobotReturningToBase = isRobotReturningToBase;
    robot3Model.robotWidth = robotWidth;
    robot3Model.labelColor = labelColor;

    console.log(robot3Model);

    // robot4 test
    robotName = "Aspiroman 4";
    robotType = "aspirator";
    basePosition = new GridPosition(7, 0);
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    startCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    targetCoordinate = this.robotActionAspiratorService.calculatePixelCoordinates(basePosition);
    batterie = 40;
    isRobotStarted = false;
    isRobotReturningToBase = false;
    robotWidth = 50;
    labelColor = this.assetRobotService.getRandomRobotLabelColor();

    let robot4Model = new RobotAspiratorModel();
    robot4Model.robotName = robotName;
    robot4Model.robotType = robotType;
    robot4Model.basePosition = { ...basePosition };
    robot4Model.lastPosition = { ...lastPosition };
    robot4Model.position = { ...position };
    robot4Model.startCoordinate = { ...startCoordinate };
    robot4Model.targetCoordinate = { ...targetCoordinate };
    robot4Model.batterie = batterie;
    robot4Model.isRobotStarted = isRobotStarted;
    robot4Model.isRobotReturningToBase = isRobotReturningToBase;
    robot4Model.robotWidth = robotWidth;
    robot4Model.labelColor = labelColor;

    console.log(robot4Model);

    // pour test de 1 ou plusieurs robots
    const robotModelTab: RobotAspiratorModel[] = [{ ...robot1Model }, { ...robot2Model }, { ...robot3Model }, { ...robot4Model }];
    // const robotModelTab = [{ ...robot2Model }, { ...robot3Model }, { ...robot4Model }];
    // const robotModelTab = [{ ...robot1Model }, { ...robot4Model }];
    // const robotModelTab = [{ ...robot1Model }];

    // spécifique aux robots aspirateurs: ajout de leurs bases de charge
    this.setRobotAspiratorBases(robotModelTab);

    return robotModelTab;
  }

  private setRobotAspiratorBases(robotModelTab: RobotAspiratorModel[]): void {
    console.log("RobotAspiratorDataService - setRobotAspiratorBases()");

    robotModelTab.forEach((robotModel: RobotAspiratorModel) => {
      const robotAspiratorModel = { ...robotModel };

      // Ajout de la base du robot dans la Maison
      const robotBasePosition: GridPosition = { ...robotAspiratorModel.basePosition };
      this.maisonDataNettoyageService.updateMaisonRobotBase(robotBasePosition);
    });
  }

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
