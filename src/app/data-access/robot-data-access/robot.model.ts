import { GridPosition } from "../../classes/models/grid-position";
import { PixelPosition } from "../../classes/models/pixel-position";
import { Direction } from "../../classes/utils/direction";

// robot.model.ts

// Base commune = l'ex "RobotConfig" > "RobotModel" (données pures, pas de classe)
export interface Robot {
    robotId: string;

    robotName: string;
    robotType: 'aspirator' | 'player';
    robotDirection: Direction;
    lastPosition: GridPosition;
    position: GridPosition;
    startCoordinate: PixelPosition;
    targetCoordinate: PixelPosition;

    isRobotStarted: boolean;
    robotWidth: number;
    labelColor: string;
    basePosition: GridPosition;
    batterie: number;
    consommationParMouvement: number;
}

// Bot aspirateur (ex-RobotAspiratorModel)
export interface RobotAspirator extends Robot {
    isRobotReturningToBase: boolean;
}

// Joueur manuel (ex-AspiromanModel)
export interface Aspiroman extends Robot {
    life: number;
    isEliminated: boolean; // false par défaut
}

// Union = "la classe générique" du store
export type RobotStateItem = RobotAspirator | Aspiroman;

export interface RobotsStateModel {
    robots: RobotStateItem[];
}

// robot.model.ts
export function isAspiroman(robot: RobotStateItem): robot is Aspiroman {
    return robot.robotType === 'player';
}

export function isRobotAspirator(robot: RobotStateItem): robot is RobotAspirator {
    return robot.robotType === 'aspirator';
}

