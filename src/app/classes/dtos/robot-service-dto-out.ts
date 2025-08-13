import { Position } from "../models/position";

// TODO: supprimer cette classe ??
export class RobotServiceDtoOut {
    batterie: number;
    // TODO: isNettoyageComplete dans classe maison (à créer)
    isNettoyageComplete: boolean;
    positions: Position[]; // Contient [lastPosition, currentPosition]

    constructor() {
        this.batterie = -1;
        this.isNettoyageComplete = false;
        this.positions = [
            new Position()
        ];
    }
}
