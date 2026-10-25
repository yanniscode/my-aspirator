import { inject, Injectable } from '@angular/core';
import { LoggerService } from '../../main-services/logger-service/logger.service';
import { Robot } from '../../../data-access/robot-data-access/robot.model';
import { RobotStore } from '../../../data-stores/robot.signal-store';

@Injectable({
  providedIn: 'root'
})
export abstract class RobotActionService<T extends Robot = Robot> {

  public serviceName = "";

  protected robotStore = inject(RobotStore);
  protected loggerService: LoggerService = inject(LoggerService);

  /**
   * Calcule de nouvelles directions selon l'intervale donnée
   */
  public abstract calculateNewDirectionsForAllRobots(): void;
}
