import { Position } from "./position";

export class RobotAspiratorModel {

    public robotName: string;
    // Position de la base de charge du robot
    public basePosition: Position;
    // Positions précédente et actuelle
    public lastPosition: Position;
    public position: Position;
    // Niveau de batterie (en pourcentage)
    public batterie: number;
    // Combien d'énergie est consommée par mouvement
    public consommationParMouvement: number;
    public isRobotStarted: boolean;
    public isRobotReturningToBase: boolean;

    constructor() {
        this.robotName = "Theodule";
        // valeurs par défaut pour l'init du robot:
        this.basePosition = new Position();
        this.lastPosition = new Position();
        this.position = new Position();
        this.batterie = -1;
        this.isRobotStarted = false;
        // Combien d'énergie est consommée par mouvement
        this.consommationParMouvement = 0.5;
        this.isRobotReturningToBase = false;
    }

    public static logger(robot: RobotAspiratorModel): void {
        console.debug("*******************");
        console.debug("RobotAspiratorModel - logger()");
        // console.debug(robot);
        console.debug("robot.robotName = " + robot.robotName);
        console.debug("robot.basePosition :");
        console.debug(robot.basePosition);
        console.debug("robot.lastPosition :");
        console.debug(robot.lastPosition);
        console.debug("robot.position :");
        console.debug(robot.position);
        console.debug(`robot.batterie: ${robot.batterie}%.`);
        console.debug("robot.isRobotStarted = " + robot.isRobotStarted);
        console.debug("robot.consommationParMouvement = " + robot.consommationParMouvement);
        console.debug("robot.isRobotReturningToBase = " + robot.isRobotReturningToBase);
        console.debug("*******************");
    }
}
