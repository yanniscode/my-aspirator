import { GridPosition } from "./grid-position";

export class CellElement {
    position: GridPosition;
    type: 'O' | 'X' | 'B' | '_'; // 'O' = nonVisitée, 'X' = mur, 'B' = base, '_' = visitée
    visited;
    reserved;

    constructor() {
        this.position = new GridPosition();
        this.type = 'O';
        this.visited = false;
        this.reserved = false;
    }
}
