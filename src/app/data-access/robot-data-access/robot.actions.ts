import { GridPosition } from "../../classes/models/grid-position";
import { PixelPosition } from "../../classes/models/pixel-position";
import { Direction } from "../../classes/utils/direction";
import { RobotStateItem } from "./robot.model";

// cf: setRobotSignalsList()
export class InitRobotsList {
    static readonly type = '[Robots] Init Robots List';
    constructor(public robots: RobotStateItem[]) { }
}
export class AddRobots {
    static readonly type = '[Robots] Add Robots';
    constructor(public robots: RobotStateItem[]) { }
}

export class RemoveRobots {
    static readonly type = '[Robots] Remove Robots';
    constructor() { }
}

export class MoveRobotCoordinates {
    static readonly type = '[Robots] Move Robot Coordinates';
    constructor(public robotId: string, public newStartCoordinate: PixelPosition, public newTargetCoordinate: PixelPosition) { }
}

export class MoveRobot {
    static readonly type = '[Robots] Move Robot';
    constructor(
        public robotId: string,
        public isRobotReturningToBase: boolean,
        public robotDirection: Direction,
        public lastPosition: GridPosition,  // la précédente position est modifiée avec l'actuelle
        public nextPosition: GridPosition,        // la nouvelle position prend sa valeur suivante
        public batterie: number,
        public consommationParMouvement: number,
        public startCoordinate: PixelPosition,
        public targetCoordinate: PixelPosition,
    ) { }
}

export class StopRobot {
    static readonly type = '[Robots] Stop Robot';
    constructor(public robotId: string) { }
}

export class EliminatePlayer {
    static readonly type = '[Robots] Eliminate Player';
    constructor(public robotId: string) { }
}

export class CheckCollisions {
    static readonly type = '[Robots] Check Collisions';
}

