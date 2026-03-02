export class GridPosition {
    row: number;
    col: number;

    constructor(row?: number, col?: number) {
        this.row = row ?? -1; // anciennement y — index ligne
        this.col = col ?? -1; // anciennement x — index colonne
    }
}
