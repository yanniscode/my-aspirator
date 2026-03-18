import { Direction } from "../utils/direction";
import { GridPosition } from "./grid-position";
import { PixelPosition } from "./pixel-position";

export class RobotModel {

    public robotName;
    public robotType;
    // Positions précédente et actuelle
    public robotDirection: Direction;
    public lastPosition: GridPosition;
    public position: GridPosition;
    public startCoordinate: PixelPosition;
    public targetCoordinate: PixelPosition;

    public isRobotStarted;
    public robotWidth;
    public labelColor

    constructor() {
        // valeurs par défaut pour l'init du robot
        this.robotName = "Theo";
        this.robotType = "aspirator"
        this.robotDirection = Direction.EAST;
        this.lastPosition = new GridPosition();
        this.position = new GridPosition();
        this.startCoordinate = new PixelPosition();
        this.targetCoordinate = new PixelPosition();
        this.isRobotStarted = false;
        this.robotWidth = 0;
        this.labelColor = '';
    }
}
