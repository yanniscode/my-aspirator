import { inject, Injectable } from '@angular/core';
import { RobotActionAspiratorService } from '../../../robot-services/robot-action-services/robot-action-aspirator-service/robot-action-aspirator.service';
import { RobotActionAspiromanService } from '../../../robot-services/robot-action-services/robot-action-aspiroman-service/robot-action-aspiroman.service';
import { RobotActionService } from '../../../robot-services/robot-action-services/robot-action.service';

@Injectable({
  providedIn: 'root',
})
export class ActionFactoryService {

  private robotActionAspiratorService = inject(RobotActionAspiratorService) as RobotActionService;
  private robotActionAspiromanService = inject(RobotActionAspiromanService) as RobotActionService;
  private actionServicesTab: RobotActionService[] = [this.robotActionAspiratorService, this.robotActionAspiromanService];

  /**
   * Renvoie la liste de services concernant les actions des personnages
   *
   * @returns
   */
  public getActionServicesTab(): RobotActionService[] {
    return this.actionServicesTab;
  }
}
