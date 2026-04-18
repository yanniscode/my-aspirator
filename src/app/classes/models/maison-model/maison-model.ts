import { CellElement } from "../cellElement";
import { GridPosition } from "../grid-position";


export class MaisonModel {
    public maison;
    public largeurMaison;
    public hauteurMaison;
    public obstacles;
    public isNettoyageComplete;

    constructor() {
        this.maison = [
            [
                new CellElement(),
            ]
        ];

        this.largeurMaison = 0;
        this.hauteurMaison = 0
        this.obstacles = [
            new GridPosition(),
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
