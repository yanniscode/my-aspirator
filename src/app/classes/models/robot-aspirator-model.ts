import { GridPosition } from "./grid-position";
import { PixelPosition } from "./pixel-position";

export class RobotAspiratorModel {

    public robotName;
    // Position de la base de charge du robot
    public basePosition: GridPosition;
    // Positions précédente et actuelle
    public lastPosition: GridPosition;
    public position: GridPosition;
    public startCoordinate: PixelPosition;
    public targetCoordinate: PixelPosition;

    // Niveau de batterie (en pourcentage)
    public batterie;
    // Combien d'énergie est consommée par mouvement
    public consommationParMouvement;
    public isRobotStarted;
    public isRobotReturningToBase;
    public robotWidth;
    public labelColor

    constructor() {
        this.robotName = "Theodule";
        // valeurs par défaut pour l'init du robot:
        this.basePosition = new GridPosition();
        this.lastPosition = new GridPosition();
        this.position = new GridPosition();
        this.startCoordinate = new PixelPosition();
        this.targetCoordinate = new PixelPosition();
        this.batterie = -1;
        this.isRobotStarted = false;
        // Combien d'énergie est consommée par mouvement
        this.consommationParMouvement = 0.5;
        this.isRobotReturningToBase = false;
        this.robotWidth = 0;
        this.labelColor = '#000000';
    }

    public static logger(robot: RobotAspiratorModel): void {
        console.debug("*******************");
        console.debug("RobotAspiratorModel - logger()");
        console.debug("robot.robotName = " + robot.robotName);
        console.debug("robot.basePosition :");
        console.debug(robot.basePosition);
        console.debug("robot.lastPosition :");
        console.debug(robot.lastPosition);
        console.debug("robot.position :");
        console.debug(robot.position);
        console.debug("robot.startCoordinate :");
        console.debug(robot.startCoordinate);
        console.debug("robot.targetCoordinate :");
        console.debug(robot.targetCoordinate);
        console.debug(`robot.batterie: ${robot.batterie}%.`);
        console.debug("robot.isRobotStarted = " + robot.isRobotStarted);
        console.debug("robot.consommationParMouvement = " + robot.consommationParMouvement);
        console.debug("robot.isRobotReturningToBase = " + robot.isRobotReturningToBase);
        console.debug("robot.robotWidth = " + robot.robotWidth);
        console.debug("robot.labelColor = " + robot.labelColor);
        console.debug("*******************");
    }
}
