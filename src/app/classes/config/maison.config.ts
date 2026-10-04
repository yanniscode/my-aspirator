import { GridPosition } from "../models/grid-position";

export class MaisonConfig {
    constructor(
        public rows: number,       // 8
        public cols: number,       // 10
        public obstacles: GridPosition[],
    ) { }

    public static logger(maisonConfig: MaisonConfig): void {
        console.debug("*******************");
        console.debug("MaisonConfig - logger()");
        console.debug("MaisonConfig.rows = " + maisonConfig.rows);
        console.debug("MaisonConfig.cols = " + maisonConfig.cols);
        console.debug("MaisonConfig.obstacles = " + maisonConfig.obstacles);
        console.debug("*******************");
    }
}
