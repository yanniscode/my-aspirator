export interface CellModel {
    id: number;
    cellName: string;
    isVisited: boolean;
}

export interface CellStateModel {
    items: CellModel[];
}
