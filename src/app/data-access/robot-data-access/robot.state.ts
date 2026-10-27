import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { isAspiroman, isRobotAspirator, RobotsStateModel, RobotStateItem } from "./robot.model";
import { AddRobots, CheckBotVsPlayersCollisions, CheckPlayerCollisions, InitRobotsList, MoveRobot, MoveRobotCoordinates, RemoveRobots, StopRobot } from "./robot.actions";

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
            robot.robotId === action.robotId ? {
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

        // Attention ! Updates purs — PAS de ...robot ici
        const robot = state.robots.find(r => r.robotId === action.robotId);
        if (!robot) return;

        const robots: RobotStateItem[] = state.robots.map((robot): RobotStateItem => {
            if (robot.robotId !== action.robotId) return robot;

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
            robot.robotId === action.robotId ? {
                ...robot,
                isRobotStarted: false,
            } : robot
        );

        ctx.setState({
            ...state,
            robots: robots, // Immutabilité
        });
    }

    @Action(CheckBotVsPlayersCollisions)
    checkBotVsPlayersCollisions(ctx: StateContext<RobotsStateModel>, action: CheckBotVsPlayersCollisions) {
        const state = ctx.getState();

        // ✅ comparaison, pas assignation
        const movedRobot = state.robots.find(r => r.robotId === action.movedRobotId);
        if (!movedRobot) return;

        const samePositionAsMoved = (r: RobotStateItem) =>
            r.position.row === movedRobot.position.row &&
            r.position.col === movedRobot.position.col;

        // Cas 1 : un BOT vient de bouger sur un joueur actif
        if (isRobotAspirator(movedRobot)) {
            const victim = state.robots.find(r =>
                isAspiroman(r) && !r.isEliminated && samePositionAsMoved(r)
            );
            if (victim) {
                this.eliminatePlayer(ctx, state.robots, victim.robotId);
            }
            return;
        }

        // ✅ Cas 2 : un JOUEUR vient de bouger sur un bot → même sanction
        if (isAspiroman(movedRobot) && !movedRobot.isEliminated) {
            const crusher = state.robots.find(r =>
                isRobotAspirator(r) && samePositionAsMoved(r)
            );
            if (crusher) {
                this.eliminatePlayer(ctx, state.robots, movedRobot.robotId);
            }
            return;
        }
    }

    private eliminatePlayer(ctx: StateContext<RobotsStateModel>, robots: RobotStateItem[], robotId: string): void {
        ctx.patchState({
            robots: robots.map(robot =>
                isAspiroman(robot) && robot.robotId === robotId
                    ? { ...robot, isEliminated: true, isRobotStarted: false, life: robot.life - 1 }
                    : robot
            ),
        });
    }

    @Action(CheckPlayerCollisions)
    checkPlayerCollisions(ctx: StateContext<RobotsStateModel>, action: CheckPlayerCollisions) {
        const state = ctx.getState();

        // Le robot qui vient de bouger
        const movedRobot = state.robots.find(r => r.robotId === action.movedRobotId);
        if (!movedRobot) return;

        // Cas 1 : c'est un joueur ACTIF qui marche sur un éliminé → résurrection !
        if (isAspiroman(movedRobot) && !movedRobot.isEliminated) {
            const ghostPlayer = state.robots.find(r =>
                isAspiroman(r) && r.isEliminated &&
                r.position.row === movedRobot.position.row &&
                r.position.col === movedRobot.position.col
            );
            if (ghostPlayer) {
                ctx.patchState({
                    robots: state.robots.map(robot =>
                        isAspiroman(robot) && robot.robotId === ghostPlayer.robotId
                            ? { ...robot, isEliminated: false, isRobotStarted: true, life: robot.life + 1 }
                            : robot
                    ),
                });
            }
            return;
        }
        // Cas 2 : c'est un joueur ÉLIMINÉ (tentative de mouvement refusée, il n'a pas bougé,
        // mais un autre pourrait être passé sur lui — couvert par le cas 1 côté actif)
        // → rien à faire ici

        // Cas 3 : c'est un ASPIRATEUR qui marche sur un éliminé → rien par défaut
    }
}
