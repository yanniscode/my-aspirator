import { Cell } from "./cell";
import { Position } from "./position";

export class MaisonModel {
    public maison: Cell[][];
    static largeurMaison: number;
    static hauteurMaison: number;
    static obstacles: Position[];

    constructor() {
        this.maison = [];
        MaisonModel.largeurMaison = 0;
        MaisonModel.hauteurMaison = 0
        MaisonModel.obstacles = [];
    }
}
