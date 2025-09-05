import { Position } from "../models/position";

export class RobotServiceDtoOut {
    batterie: number;
    isNettoyageComplete: boolean;
    positions: Position[]; // Contient [lastPosition, currentPosition]
    isRobotReturningToBase: boolean;

    constructor() {
        this.batterie = -1;
        this.isNettoyageComplete = false;
        this.positions = [
            new Position()
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
