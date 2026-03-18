import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { RobotAspiratorModel } from '../../../classes/models/robot-aspirator-model';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotFactoryService {

  /**
   * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
   */
  protected readonly _robotSignals: Map<string, WritableSignal<RobotAspiratorModel>> = new Map<string, WritableSignal<RobotAspiratorModel>>();
  public robotSignals: Map<string, WritableSignal<RobotAspiratorModel>> = this._robotSignals;

  // TODO: revoir le type RobotAspiratorModel > générique RobotModel
  /**
   * Instancie la liste de robots avec leurs données
   */
  public abstract createAspiratorRobots(): RobotAspiratorModel[];

  /**
  * Désenregistre un robot et nettoie son signal
  */
  public unregisterRobotFromList(robotName: string): void {
    console.log("RobotFactoryService - unregisterRobotFromList()");

    if (this._robotSignals.delete(robotName)) {
      console.log(`Robot ${robotName} désenregistré`);
    }
  }

  /**
  * Enregistre un nouveau robot dans la liste
  */
  public registerRobotInList(robotModel: RobotAspiratorModel): void {
    console.log("RobotFactoryService - registerRobotInList()");

    if (!this._robotSignals.has(robotModel.robotName)) {
      this._robotSignals.set(robotModel.robotName, signal(robotModel));
    } else {
      console.warn(`Robot ${robotModel.robotName} déjà enregistré`);
    }
  }

  /**
   *
   *  Lecture directe (non-réactive) de l'état actuel du robot
   *  Retourne le signal readonly du robot
   *
   * @param robotName
   * @returns
   */
  public getRobotSignal(robotName: string): Signal<RobotAspiratorModel | undefined> {
    console.log("RobotFactoryService - getRobotSignal()");

    const writableSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    return writableSignal?.asReadonly() ?? signal(undefined);
  }

  // TODO: à voir si utilisation possible
  /**
  * Retourne la liste des noms de tous les robots enregistrés
  */
  // getAllRobotNames(): string[] {
  //   return Array.from(this.robotSignals.keys());
  // }

  /**
  * Retourne le nombre de robots actifs
  */
  // getRobotCount(): number {
  //   return this.robotSignals.size;
  // }

  // MÉTHODES D'ACTION SUR LE ROBOT:

  /**
  * Met à jour un robot dans la liste de signaux (appelé par la boucle d'animation)
  */
  // private updateRobotModel(robotModel: RobotAspiratorModel | undefined): void {
  //   if (!robotModel) return;

  //   const robotSignal = this.robotSignals.get(robotModel.robotName);
  //   if (robotSignal) {
  //     robotSignal.set(robotModel);
  //   }
  // }
}
