import { Cell } from "./cell";
import { Position } from "./position";

export class Maison {
    public maison: Cell[][];
    public largeurMaison: number;
    public hauteurMaison: number;
    public obstacles: Position[];

    constructor() {
        this.maison = [];
        this.largeurMaison = 0;
        this.hauteurMaison = 0
        this.obstacles = [];
    }
}
