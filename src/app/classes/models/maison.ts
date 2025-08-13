import { Cell } from "./cell";
import { Position } from "./position";

export class Maison {
    public maison: Cell[][];
    static largeurMaison: number;
    static hauteurMaison: number;
    static obstacles: Position[];

    constructor() {
        this.maison = [];
        Maison.largeurMaison = 0;
        Maison.hauteurMaison = 0
        Maison.obstacles = [];
    }
}
