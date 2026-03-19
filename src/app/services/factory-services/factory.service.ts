import { Injectable, WritableSignal } from '@angular/core';
import { RobotModel } from '../../classes/models/robot-model';

@Injectable({
  providedIn: 'root',
})
export abstract class FactoryService {

  /**
   * Méthode de factory : renvoie les paramètres des robots avec un upcast vers le type générique RobotModel[]
   */
  public abstract getRobotsParams(): RobotModel[];

  /**
   * Méthode qui enregistre les signaux des robots dans une liste (pour synchroniser les données)
   * 
   * @param robotModel 
   */
  public abstract setRobotListSignals(robotModel: RobotModel[]): WritableSignal<string[]>;
}
