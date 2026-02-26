import { CellElement } from "./cellElement";
import { Position } from "./position";

export class MaisonModel {
    public maison: CellElement[][];
    public largeurMaison: number;
    public hauteurMaison: number;
    public obstacles: Position[];
    public isNettoyageComplete: boolean;

    constructor() {
        this.maison = [
            [
                new CellElement(),
            ]
        ];

        this.largeurMaison = 0;
        this.hauteurMaison = 0
        this.obstacles = [
            new Position(),
        ];
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
