import { Position } from "./position";

export class CellElement {
    position: Position;
    type: 'O' | 'X' | 'B' | '_' | 'R'; // 'O' = nonVisitée, 'X' = mur, 'B' = base, '_' = visitée, 'R' = robot
    visited: boolean;

    constructor() {
        this.position = new Position();
        this.type = 'O';
        this.visited = false;
    }
}