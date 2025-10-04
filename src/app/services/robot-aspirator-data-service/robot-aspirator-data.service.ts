import { Injectable } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorDataService {

  constructor() { }

  // TODO: refacto dans service robot-data
  public getRobotsParams(): RobotAspiratorModel[] {

    // robot1 test
    // 1 - Récupération des datas :
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    let robotName = "robot1";
    let basePosition = { x: 0, y: 0 };
    // au départ, le robot est à la base:
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let batterie = 50;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;

    // 2 - Instanciation du RobotAspiratorModel:
    let robot1Model = new RobotAspiratorModel();
    robot1Model.robotName = robotName;
    robot1Model.basePosition = { ...basePosition };
    // au départ, le robot est à la base:
    robot1Model.lastPosition = { ...lastPosition };
    robot1Model.position = { ...position };
    robot1Model.batterie = batterie;
    robot1Model.isRobotStarted = isRobotStarted;
    robot1Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot1Model);

    // robot2 test
    // 1 - Récupération des datas :
    robotName = "robot2";
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    basePosition = { x: 9, y: 0 };
    // Au départ, le robot est à la base:
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 60;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    // 2 - Instanciation du RobotAspiratorModel:
    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.basePosition = { ...basePosition };
    // Au départ, le robot est à la base:
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.batterie = batterie;
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot2Model);

    // TODO: pour tester avec 1 ou 2 robots, ajouter ici
    return [robot1Model, robot2Model];
  }
}
