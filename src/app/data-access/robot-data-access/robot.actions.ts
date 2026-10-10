import { RobotStateItem } from "./robot.model";

// cf: setRobotSignalsList()
export class InitRobotsList {
    static readonly type = '[Robots] Init Robots List';
    constructor(public items: RobotStateItem[]) { }
}

// TODO:
// cf: getRobotSignalsList()
// export class GetRobotsList {
//     static readonly type = '[Robots] Get Robots List';
//     constructor() { }
// }

// cf: registerRobotInList()

// cf: clearAllRobotsList()

// cf: updateCurrentCoordinates()

// cf: moveRobotCoordinates()

// cf: calculatePixelCoordinates()

// cf: moveRobot()

// cf: stopRobot()

// cf: updateRobotsVisitedCells()

// cf: createPlayersActionParams()

// cf: getJsonData()

// cf: setRobotAspiratorBases()

// cf: getRobotDirectionByPosition()
