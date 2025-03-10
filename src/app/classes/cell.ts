import { Position } from "./position";

export interface Cell {
    position: Position;
    type: 'O' | 'X' | 'B' | '_' | 'N'; // 'O' = nonVisitée, 'X' = mur, 'B' = base, '_' = visitée, 'N' = robot
    visited: boolean;
};
