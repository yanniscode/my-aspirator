import { GridPosition } from "./grid-position";
import { PixelPosition } from "./pixel-position";

export class RobotModel {

    public robotName;
    // Positions précédente et actuelle
    public lastPosition: GridPosition;
    public position: GridPosition;
    public startCoordinate: PixelPosition;
    public targetCoordinate: PixelPosition;

    public isRobotStarted;
    public robotWidth;
    public labelColor

    constructor() {
        this.robotName = "Theo";
        // valeurs par défaut pour l'init du robot:
        this.lastPosition = new GridPosition();
        this.position = new GridPosition();
        this.startCoordinate = new PixelPosition();
        this.targetCoordinate = new PixelPosition();
        this.isRobotStarted = false;
        this.robotWidth = 0;
        this.labelColor = '';
    }
}
