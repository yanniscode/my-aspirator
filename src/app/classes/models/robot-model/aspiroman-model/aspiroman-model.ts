import { GridPosition } from "../../grid-position";
import { RobotModel } from "../robot-model";

/**
 * Model du robot en mode manuel (en dev)
 */
export class AspiromanModel extends RobotModel {
    // Position de la base de charge du robot
    public basePosition: GridPosition;
    // Niveau de batterie (en pourcentage)
    public batterie;
    // Combien d'énergie est consommée par mouvement
    public consommationParMouvement;
    public isRobotReturningToBase;

    constructor() {
        super();
        // valeurs par défaut pour l'init du robot:
        this.robotType = "player"
        this.basePosition = new GridPosition();
        this.batterie = -1;
        // Combien d'énergie est consommée par mouvement
        this.consommationParMouvement = 0.5;
        this.isRobotReturningToBase = false;
    }

    public static logger(robot: AspiromanModel): void {
        console.debug("*******************");
        console.debug("AspiromanModel - logger()");
        console.debug("robot.robotName = " + robot.robotName);
        console.debug("robot.robotType = " + robot.robotType);
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
