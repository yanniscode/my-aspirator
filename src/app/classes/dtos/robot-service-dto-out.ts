import { GridPosition } from "../models/grid-position";

/**
 * Utilisée pour algo V2 - RobotAspiratorWithNextPositionsTabService (à revoir avec Canvas + Signals si nécessaire)
 */
export class RobotServiceDtoOut {
    batterie;
    isNettoyageComplete;
    positions;    // tableau de GridPosition pour la logique : Contient [lastPosition, currentPosition]
    isRobotReturningToBase;

    constructor() {
        this.batterie = -1;
        this.isNettoyageComplete = false;
        this.positions = [
            new GridPosition()
        ];
        this.isRobotReturningToBase = false;
    }

    public static logger(robotServiceDtoOut: RobotServiceDtoOut): void {
        console.debug("*******************");
        console.debug("RobotServiceDtoOut - logger()");
        // console.debug(robotServiceDtoOut);
        console.debug(`robotServiceDtoOut.batterie: ${robotServiceDtoOut.batterie}%.`);
        console.debug("robotServiceDtoOut.isNettoyageComplete = " + robotServiceDtoOut.isNettoyageComplete);
        console.debug("robotServiceDtoOut.positions :");
        console.debug(robotServiceDtoOut.positions);
        console.debug(robotServiceDtoOut.positions[0]);
        console.debug(robotServiceDtoOut.positions[1]);
        console.debug("robotServiceDtoOut.isRobotReturningToBase = " + robotServiceDtoOut.isRobotReturningToBase);
        console.debug("*******************");
    }
}
