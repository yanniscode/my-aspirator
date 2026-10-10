import { GridPosition } from "../../classes/models/grid-position";
import { PixelPosition } from "../../classes/models/pixel-position";
import { Direction } from "../../classes/utils/direction";

// robot.model.ts

// Base commune = l'ex "RobotConfig" > "RobotModel" (données pures, pas de classe)
export interface Robot {
    robotId: string;

    robotName: string;
    robotType: string;
    // Positions précédente et actuelle
    robotDirection: Direction;
    lastPosition: GridPosition;
    position: GridPosition;
    startCoordinate: PixelPosition;
    targetCoordinate: PixelPosition;

    isRobotStarted: boolean;
    robotWidth: number;
    labelColor: string;
}

// Bot aspirateur (ex-RobotAspiratorModel)
export interface RobotAspirator extends Robot {
    // robotType: 'aspirator';  // ← discriminant

    // Position de la base de charge du robot
    basePosition: GridPosition;
    // Niveau de batterie (en pourcentage)
    batterie: number;
    // Combien d'énergie est consommée par mouvement
    consommationParMouvement: number;
    isRobotReturningToBase: boolean;
}

// Joueur manuel (ex-AspiromanModel)
export interface Aspiroman extends Robot {
    // spécificités du joueur humain (aucune variable isReturningToBase)

    // robotType: 'player';     // ← discriminant

    basePosition: GridPosition;
    batterie: number;
    consommationParMouvement: number;
}

// Union = "la classe générique" du store
export type RobotStateItem = RobotAspirator | Aspiroman;

export interface RobotsStateModel {
    items: RobotStateItem[];
}
