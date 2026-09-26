import { GridPosition } from "../classes/models/grid-position";

export interface CellElement {
    cellId: number,
    position: GridPosition;
    cellType: 'O' | 'X' | 'B' | '_'; // 'O' = non visitée, 'X' = mur, 'B' = base, '_' = visitée
    visited: boolean;
    reserved: boolean;
}

export interface CellStateModel {
    item: CellElement;
}

export interface CellsStateModel {
    items: CellElement[];
    cellId: number; // ✅ Ajoute cellId à l'état
}
