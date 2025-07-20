import { Position } from "./position";

export interface RobotServiceData {
    batterie: number;
    isNettoyageComplete: boolean;
    positions: Position[]; // Contient [lastPosition, currentPosition]
}
