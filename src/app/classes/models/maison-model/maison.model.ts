import { GridPosition } from "../grid-position";
import { AbstractModel } from "../abstract-model";

export interface CellElement {
    cellId: number,
    position: GridPosition;
    cellType: 'O' | 'X' | 'B' | '_'; // 'O' = non visitée, 'X' = mur, 'B' = base, '_' = visitée
    visited: boolean;
    reserved: boolean;
}

export function newDefaultCell(row: number, col: number, cellType: 'O' | 'X' | 'B' | '_'): CellElement {
    return {
        cellId: -1,
        position: new GridPosition(row, col),
        cellType: '_',
        visited: false,
        reserved: false,
    };
}

export interface CellStateModel {
    item: CellElement;
}

export interface CellsStateModel extends AbstractModel {
    items: CellElement[];
    cellId: number; // ✅ Ajoute cellId à l'état
    rows: number; // 8,
    cols: number; //10
    obstacles: GridPosition[];
}
