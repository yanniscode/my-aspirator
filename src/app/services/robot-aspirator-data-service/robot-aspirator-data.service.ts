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
    robotName = "robot2";
    basePosition = { x: 9, y: 0 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 60;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.basePosition = { ...basePosition };
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.batterie = batterie;
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot2Model);

    // robot3 test
    robotName = "robot3";
    basePosition = { x: 9, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 20;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot3Model = new RobotAspiratorModel();
    robot3Model.robotName = robotName;
    robot3Model.basePosition = { ...basePosition };
    robot3Model.lastPosition = { ...lastPosition };
    robot3Model.position = { ...position };
    robot3Model.batterie = batterie;
    robot3Model.isRobotStarted = isRobotStarted;
    robot3Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot3Model);

    // robot3 test
    robotName = "robot4";
    basePosition = { x: 0, y: 7 };
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 20;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot4Model = new RobotAspiratorModel();
    robot4Model.robotName = robotName;
    robot4Model.basePosition = { ...basePosition };
    robot4Model.lastPosition = { ...lastPosition };
    robot4Model.position = { ...position };
    robot4Model.batterie = batterie;
    robot4Model.isRobotStarted = isRobotStarted;
    robot4Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot4Model);

    return [robot1Model, robot2Model, robot3Model, robot4Model];
  }
}
