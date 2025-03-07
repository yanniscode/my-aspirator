import { Position } from "./position";

export interface Cell {
    position: Position;
    type: '_' | 'X' | 'B' | 'O' | 'R'; // B = base, O = nonVisitée, R = robot
    visited: boolean;
};