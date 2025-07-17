import { Position } from "./position";

export interface PositionResult {
    positions: Position[]; // Contient [lastPosition, currentPosition]
    isNettoyageComplete: boolean;
}
