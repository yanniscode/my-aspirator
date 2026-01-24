export class Position {
    x: number;
    y: number;

    constructor(x?: number, y?: number) {
        this.x = x ?? -1;
        this.y = y ?? -1;
    }
}
