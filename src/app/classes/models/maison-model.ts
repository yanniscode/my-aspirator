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

    public static logger(maisonModel: MaisonModel): void {
        console.debug("*******************");
        console.debug("MaisonModel - logger()");
        // console.debug(maisonModel);
        console.debug("maisonModel.maison = " + maisonModel.maison);
        console.debug("maisonModel.largeurMaison = " + maisonModel.largeurMaison);
        console.debug("maisonModel.hauteurMaison = " + maisonModel.hauteurMaison);
        console.debug("maisonModel.obstacles = " + maisonModel.obstacles);
        console.debug("maisonModel.isNettoyageComplete = " + maisonModel.isNettoyageComplete);
        console.debug("*******************");
    }
}
