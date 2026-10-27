import { signalStore, withComputed, withMethods } from "@ngrx/signals";
import { withActions, withSelectors } from "../../shared/ngxs.utils";
import { RobotSelectors } from "../data-access/robot-data-access/robot.selector";
import { AddRobots, InitRobotsList, RemoveRobots, MoveRobotCoordinates, MoveRobot, StopRobot, CheckBotVsPlayersCollisions, CheckPlayerCollisions } from "../data-access/robot-data-access/robot.actions";
import { computed } from "@angular/core";
import { Aspiroman, isAspiroman, isRobotAspirator, RobotAspirator, RobotStateItem } from "../data-access/robot-data-access/robot.model";

export const RobotStore = signalStore(
    { providedIn: 'root' },
    withSelectors({
        robots: RobotSelectors.robots,
    }),
    withActions({
        initRobotsList: InitRobotsList,
        addRobots: AddRobots,
        removeRobots: RemoveRobots,
        moveRobotCoordinates: MoveRobotCoordinates,
        moveRobot: MoveRobot,
        stopRobot: StopRobot,
        dispatchCheckBotVsPlayersCollisions: CheckBotVsPlayersCollisions,
        dispatchCheckPlayerCollisions: CheckPlayerCollisions,
    }),
    withComputed((store) => ({
        // Méthodes computed des robots génériques:
        robotsCount: computed(() => store.robots().length),
        robotIds: computed(() =>
            store.robots().map((r) => r.robotId)
        ),
        hasActiveRobots: computed(() => store.robots().some(r => r.isRobotStarted)),
        // Remplace la Map : accès par nom, réactif et toujours à jour
        // Accès par id (recommandé : le nom peut changer, pas l'id)
        robotsById: computed(() => {
            const map = new Map<string, RobotStateItem>();
            for (const r of store.robots()) map.set(r.robotId, r);
            return map;
        }),
        // Méthodes computed des robots aspirateurs (bots):
        // Filtres par type (si on active le discriminant)
        aspirators: computed(() => store.robots().filter((r): r is RobotAspirator => r.robotType === 'aspirator')),
        aspiratorsById: computed(() => {
            const map = new Map<string, RobotAspirator>();
            // TODO: améliorer écriture ??
            for (const r of store.robots().filter((r): r is RobotAspirator => r.robotType === 'aspirator')) map.set(r.robotId, r);
            return map;
        }),
        aspiratorsByName: computed(() => {
            const map = new Map<string, RobotAspirator>();
            // TODO: améliorer écriture ??
            for (const r of store.robots().filter((r): r is RobotAspirator => r.robotType === 'aspirator')) map.set(r.robotName, r);
            return map;
        }),
        // Méthodes computed des robots joueurs:
        players: computed(() => store.robots().filter((r): r is Aspiroman => r.robotType === 'player')),
        playersById: computed(() => {
            const map = new Map<string, Aspiroman>();
            for (const r of store.robots().filter((r): r is Aspiroman => r.robotType === 'player')) {
                map.set(r.robotId, r);
            }
            return map;
        }),
        playersByName: computed(() => {
            const map = new Map<string, Aspiroman>();
            for (const r of store.robots().filter((r): r is Aspiroman => r.robotType === 'player')) {
                map.set(r.robotName, r);
            }
            return map;
        }),
    })),
    withMethods((store) => ({
        // Méthodes pour les robots génériques:

        // Lecture ponctuelle (remplace getRobotSignalsList)
        robotById(id: string): RobotStateItem | undefined {
            return store.robotsById().get(id);
        },
        robotId(id: string): String | undefined {
            // TODO: supprimer les '?'
            return store.robotsById().get(id)?.robotId;
        },
        // Méthodes pour les robots aspirateurs (bots):
        aspiratorNames(): string[] {
            return store.aspirators().map((r) => r.robotName);
        },
        aspiratorById(id: string): RobotAspirator | undefined {
            return store.aspiratorsById().get(id);
        },
        aspiratorName(name: string): String | undefined {
            return store.playersByName().get(name)?.robotName;
        },
        // Méthodes pour les robots joueurs:
        playerNames(): String[] {
            return store.players().map((r) => r.robotName);
        },
        playerById(id: string): Aspiroman | undefined {
            return store.playersById().get(id);
        },
        // Déclenche la vérification → c'est le handler NGXS qui élimine
        checkBotVsPlayersCollisions(id: string): void {
            store.dispatchCheckBotVsPlayersCollisions(id);   // ton withActions branché sur l'action
        },
        checkPlayerCollisions(id: string): void {
            store.dispatchCheckPlayerCollisions(id);   // ton withActions branché sur l'action
        },
    }))
);
