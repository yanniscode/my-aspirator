import { Position } from "./position";

export interface Cell {
    position: Position;
    type: '_' | 'X' | 'B' | 'O' | 'N'; // _ = nonVisitée, B = base, O = visitée, R = robot N
    visited: boolean;
};