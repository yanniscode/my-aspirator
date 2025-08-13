import { CellElement } from "./cellElement";
import { Position } from "./position";

export class Cell {
    cellStack: CellElement[];

    constructor() {
        this.cellStack = [
            {
                position: new Position(),
                type: 'O',
                visited: false
            }
        ]
    }
}

