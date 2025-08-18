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
    }
}
