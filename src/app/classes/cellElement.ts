import { Position } from "./position";

export interface CellElement {
    position: Position;
    type: 'O' | 'X' | 'B' | '_' | 'R'; // 'O' = nonVisitée, 'X' = mur, 'B' = base, '_' = visitée, 'R' = robot
    visited: boolean;
};