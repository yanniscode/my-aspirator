import { GridPosition } from "./grid-position";

export class CellElement {
    cellId: number;
    position: GridPosition;
    cellType: 'O' | 'X' | 'B' | '_'; // 'O' = nonVisitée, 'X' = mur, 'B' = base, '_' = visitée
    visited;
    reserved;

    constructor() {
        this.cellId = -1;
        this.position = new GridPosition();
        this.cellType = 'O';
        this.visited = false;
        this.reserved = false;
    }
}
