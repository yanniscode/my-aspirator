import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { Aspiroman, isAspiroman, isRobotAspirator, RobotsStateModel, RobotStateItem } from "./robot.model";
import { AddRobots, CheckCollisions, EliminatePlayer, InitRobotsList, MoveRobot, MoveRobotCoordinates, RemoveRobots, StopRobot } from "./robot.actions";

@State<RobotsStateModel>({
    name: 'robots', // Nom du slice dans le store
    defaults: {
        robots: [],
    },
})
@Injectable()
export class RobotState {

    @Action(InitRobotsList)
    initRobotsList(ctx: StateContext<RobotsStateModel>, action: InitRobotsList) {
        console.log("State - initRobotsList");
        ctx.patchState({ robots: action.robots });
    }

    /**
     * Handler: Ajout d'une liste de robots dans la liste principale
     *
     * @param ctx
     * @param action
     */
    @Action(AddRobots)
    addRobots(ctx: StateContext<RobotsStateModel>, action: AddRobots) {
        console.log("State - addRobots");

        const state = ctx.getState();

        const existingIds = new Set(state.robots.map(r => r.robotId));
        const newRobots = action.robots.filter(r => !existingIds.has(r.robotId));

        ctx.patchState({ robots: [...state.robots, ...newRobots] });
    }

    /**
     * Reset de la liste globale de robots
     *
     * @param ctx
     * @param action
     */
    @Action(RemoveRobots)
    removeRobots(ctx: StateContext<RobotsStateModel>) {
        console.log("State - removeRobots");

        ctx.patchState({ robots: [] });
    }

    @Action(MoveRobotCoordinates)
    moveRobotCoordinates(ctx: StateContext<RobotsStateModel>, action: MoveRobotCoordinates) {
        console.log("State - moveRobotCoordinates");
        const state: RobotsStateModel = ctx.getState();

        const robots: RobotStateItem[] = state.robots.map(robot =>
            robot.robotName === action.robotName ? {
                ...robot,
                startCoordinate: { ...action.newStartCoordinate },
                targetCoordinate: { ...action.newTargetCoordinate },
            } : robot
        );

        ctx.setState({
            ...state,
            robots: robots, // Immutabilité
        });
    }

    @Action(MoveRobot)
    moveRobot(ctx: StateContext<RobotsStateModel>, action: MoveRobot) {
        console.log("State - moveRobot");
        const state: RobotsStateModel = ctx.getState();

        // Garde : joueur éliminé → mouvement refusé
        // Attention ! Updates purs — PAS de ...robot ici
        const robot = state.robots.find(r => r.robotName === action.robotName);
        if (!robot) return;
        if (isAspiroman(robot) && robot.isEliminated) return;

        const robots: RobotStateItem[] = state.robots.map((robot): RobotStateItem => {
            if (robot.robotName !== action.robotName) return robot;

            // Champs communs
            const updates = {
                isRobotStarted: true,
                robotDirection: action.robotDirection,
                lastPosition: { ...action.lastPosition },   // la précédente position est modifiée avec l'actuelle
                position: { ...action.nextPosition },       // la nouvelle position prend sa valeur suivante
                startCoordinate: { ...action.startCoordinate },
                targetCoordinate: { ...action.targetCoordinate },
                batterie: action.batterie - action.consommationParMouvement,
            };

            // ⚠️ Nécessite que robotType soit un vrai discriminant :
            // AspiratorRobot { robotType: 'aspirator' } / Aspiroman { robotType: 'player' }
            if (robot.robotType === 'aspirator') {
                return {
                    ...robot,
                    ...updates,
                    isRobotReturningToBase: action.isRobotReturningToBase, // n'existe que chez l'aspirateur
                };
            }
            return {
                ...robot,
                ...updates,
            };
        });

        ctx.patchState({
            robots, // Immutabilité
        });
    }

    @Action(StopRobot)
    stopRobot(ctx: StateContext<RobotsStateModel>, action: StopRobot) {
        console.log("State - stopRobot");
        const state: RobotsStateModel = ctx.getState();

        const robots: RobotStateItem[] = state.robots.map(robot =>
            robot.robotName === action.robotName ? {
                ...robot,
                isRobotStarted: false,
            } : robot
        );

        ctx.setState({
            ...state,
            robots: robots, // Immutabilité
        });
    }

    @Action(EliminatePlayer)
    eliminatePlayer(ctx: StateContext<RobotsStateModel>, action: EliminatePlayer) {
        const state = ctx.getState();

        ctx.patchState({
            robots: state.robots.map(robot =>
                isAspiroman(robot) && robot.robotName === action.robotName
                    ? {
                        ...robot,
                        isEliminated: true,
                        life: robot.life - 1,
                        isRobotStarted: false,
                    }
                    : robot
            ),
        });
    }

    @Action(CheckCollisions)
    checkCollisions(ctx: StateContext<RobotsStateModel>) {
        const state = ctx.getState();

        const aspirateurs = state.robots.filter(isRobotAspirator);
        const joueursElimines = state.robots
            .filter(r => isAspiroman(r) && !r.isEliminated)
            .filter(j => aspirateurs.some(a =>
                a.position.row === j.position.row &&
                a.position.col === j.position.col
            ))
            .map(j => j.robotName);

        // Rien à faire si aucune collision
        if (joueursElimines.length === 0) return;

        // Sinon, si c'est un robot Joueur, il est éliminé et une vie lui est retranchée
        ctx.patchState({
            robots: state.robots.map(robot =>
                isAspiroman(robot) && joueursElimines.includes(robot.robotName)
                    ? {
                        ...robot,
                        isEliminated: true,
                        isRobotStarted: false,
                        life: robot.life - 1,
                        startCoordinate: { x: robot.basePosition.col * 50, y: robot.basePosition.row * 50 },
                        targetCoordinate: { x: robot.basePosition.col * 50, y: robot.basePosition.row * 50 },
                    }
                    : robot
            ),
        });
    }
}
