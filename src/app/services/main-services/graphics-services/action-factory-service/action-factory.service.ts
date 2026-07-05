import { inject, Injectable } from '@angular/core';
import { RobotActionAspiratorService } from '../../../robot-services/robot-action-services/robot-action-aspirator-service/robot-action-aspirator.service';
import { RobotActionAspiromanService } from '../../../robot-services/robot-action-services/robot-action-aspiroman-service/robot-action-aspiroman.service';
import { RobotActionService } from '../../../robot-services/robot-action-services/robot-action.service';
import { RobotAspiromanDataService } from '../../../robot-services/robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';

@Injectable({
  providedIn: 'root',
})
export class ActionFactoryService {

  private robotAspiromanDataService = inject(RobotAspiromanDataService);
  private robotActionAspiratorService = inject(RobotActionAspiratorService);
  private robotActionAspiromanService = inject(RobotActionAspiromanService);
  private actionServicesTab: RobotActionService[] = [this.robotActionAspiratorService, this.robotActionAspiromanService];

  constructor() {
    console.log("ActionFactoryService - constructor()");
  }

  /**
   * Renvoie la liste de services concernant les actions des personnages
   *
   * @returns
   */
  public getActionServicesTab(): RobotActionService[] {
    return this.actionServicesTab;
  }

  /**
   * Renvoie la Map de signaux contenant la direction de déplacement manuelle en cours de chaque Joueur
   *
   * @param playerName
   * @returns
   */
  public getPlayerMoveDirectionSignals(playerName: string) {
    console.log("ActionFactoryService - getPlayerMoveDirectionSignals()");

    return this.robotAspiromanDataService.playerMoveDirectionSignals.get(playerName);;
  }

  /**
   * Déclenche le déplacement d'un robot de type Joueur
   *
   * @param playerName
   */
  public triggerRobotPlayerMove(playerName: string) {
    console.log("ActionFactoryService - triggerRobotPlayerMove");

    this.robotAspiromanDataService.moveRobot(playerName);
    this.robotAspiromanDataService.updateRobotsVisitedCells();
  }
}
