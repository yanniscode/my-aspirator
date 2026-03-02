import { GridPosition } from "./grid-position";

export class CellElement {
    position: GridPosition;
    type: 'O' | 'X' | 'B' | '_' | 'R'; // 'O' = nonVisitée, 'X' = mur, 'B' = base, '_' = visitée, 'R' = robot
    visited: boolean;

    constructor() {
        this.position = new GridPosition();
        this.type = 'O';
        this.visited = false;
    }
}
