import { GridPosition } from "../classes/models/grid-position";
import { CellElement } from "./maison.model";

export class AddCell {
    static readonly type = '[Cell] Add cell';
    constructor(
        public cellType: 'O' | 'X' | 'B' | '_',
        public position: GridPosition,
    ) { }
}

export class GetCellByPosition {
    static readonly type = '[Cell] Get cell by position';
    constructor(
        public readonly position: GridPosition,
    ) { }
}

export class UpdateCellByPosition {
    static readonly type = '[Cell] Update cell by position';
    constructor(
        public readonly cellId: number,
        public readonly position: GridPosition,
    ) { }
}

export class UpdateCellType {
    static readonly type = '[Cell] Update cell type';
    constructor(
        public readonly cellId: number,
        public readonly cellType: 'O' | 'X' | 'B' | '_',
    ) { }
}

export class UpdateCellVisited {
    static readonly type = '[Cell] Update cell visited';
    constructor(
        public readonly cellId: number,
        public readonly visited: boolean,
    ) { }
}

export class UpdateCellReserved {
    static readonly type = '[Cell] Update cell reserved';
    constructor(
        public readonly cellId: number,
        public readonly reserved: boolean,
    ) { }
}

