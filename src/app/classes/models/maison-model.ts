import { Cell } from "./cell";
import { Position } from "./position";

export class MaisonModel {
    public maison: Cell[][];
    public largeurMaison: number;
    public hauteurMaison: number;
    public obstacles: Position[];
    public isNettoyageComplete: boolean;

    constructor() {
        this.maison = [];
        this.largeurMaison = 0;
        this.hauteurMaison = 0
        this.obstacles = [];
        this.isNettoyageComplete = false;
    }
}
