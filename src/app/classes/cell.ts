import { Position } from "./position";

export interface Cell {
    position: Position;
    type: '_' | 'X' | 'B' | 'O'; // B = base, O = nonVisitée
    visited: boolean;
};