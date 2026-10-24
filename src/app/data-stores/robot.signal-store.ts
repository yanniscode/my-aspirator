import { signalStore, withComputed, withMethods } from "@ngrx/signals";
import { withActions, withSelectors } from "../../shared/ngxs.utils";
import { RobotSelectors } from "../data-access/robot-data-access/robot.selector";
import { AddRobots, InitRobotsList, RemoveRobots, MoveRobotCoordinates, MoveRobot, StopRobot, CheckCollisions } from "../data-access/robot-data-access/robot.actions";
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
        dispatchCheckCollisions: CheckCollisions
    }),
    withComputed((store) => ({
        // Méthodes computed des robots génériques:
        robotsCount: computed(() => store.robots().length),
        robotNames: computed(() =>
            store.robots().map((r) => r.robotName)
        ),
        hasActiveRobots: computed(() => store.robots().some(r => r.isRobotStarted)),
        // Remplace la Map : accès par nom, réactif et toujours à jour
        robotsByName: computed(() => {
            const map = new Map<string, RobotStateItem>();
            for (const r of store.robots()) map.set(r.robotName, r);
            return map;
        }),
        // Accès par id (recommandé : le nom peut changer, pas l'id)
        robotsById: computed(() => {
            const map = new Map<string, RobotStateItem>();
            for (const r of store.robots()) map.set(r.robotId, r);
            return map;
        }),
        // Méthodes computed des robots aspirateurs (bots):
        // Filtres par type (si on active le discriminant)
        aspirators: computed(() => store.robots().filter((r): r is RobotAspirator => r.robotType === 'aspirator')),
        aspiratorsByName: computed(() => {
            const map = new Map<string, RobotAspirator>();
            // TODO: améliorer écriture ??
            for (const r of store.robots().filter((r): r is RobotAspirator => r.robotType === 'aspirator')) map.set(r.robotName, r);
            return map;
        }),
        aspiratorsNames: computed(() => {
            const namesList: string[] = [];
            let i = 0;
            for (const r of store.robots().filter((r): r is Aspiroman => r.robotType === 'player')) {
                namesList[i] = r.robotName;
                i++;
            }
            return namesList;
        }),
        // Méthodes computed des robots joueurs:
        players: computed(() => store.robots().filter((r): r is Aspiroman => r.robotType === 'player')),
        playersNames: computed(() => {
            const namesList: string[] = [];
            let i = 0;
            for (const r of store.robots().filter((r): r is Aspiroman => r.robotType === 'player')) {
                namesList[i] = r.robotName;
                i++;
            }
            return namesList;
        }),
        playersByName: computed(() => {
            const map = new Map<string, Aspiroman>();
            for (const r of store.robots().filter((r): r is Aspiroman => r.robotType === 'player')) {
                map.set(r.robotName, r);
            }
            return map;
        }),
        // Joueurs entrant en collision avec un aspirateur
        collisions: computed(() => {
            const robots = store.robots();
            const aspirateurs = robots.filter(isRobotAspirator);
            const joueurs = robots.filter(r => isAspiroman(r) && !r.isEliminated);

            return joueurs.filter(j =>
                aspirateurs.some(a =>
                    a.position.row === j.position.row &&
                    a.position.col === j.position.col
                )
            );
        }),
    })),
    withMethods((store) => ({
        // Méthodes pour les robots génériques:
        // Lecture ponctuelle (remplace getRobotSignalsList)
        robotByName(name: string): RobotStateItem | undefined {
            return store.robotsByName().get(name);
        },
        robotName(name: string): String | undefined {
            // TODO: supprimer les '?'
            return store.robotsByName().get(name)?.robotName;
        },
        // Méthodes pour les robots aspirateurs (bots):
        aspiratorNames(): string[] {
            return store.aspirators().map((r) => r.robotName);
        },
        aspiratorByName(name: string): RobotAspirator | undefined {
            return store.aspiratorsByName().get(name);
        },
        aspiratorName(name: string): String | undefined {
            return store.playersByName().get(name)?.robotName;
        },
        // Méthodes pour les robots joueurs:
        playerNames(): String[] {
            return store.players().map((r) => r.robotName);
        },
        playerByName(name: string): Aspiroman | undefined {
            return store.playersByName().get(name);
        },
        playerName(name: string): String | undefined {
            return store.playersByName().get(name)?.robotName;
        },
        // Déclenche la vérification → c'est le handler NGXS qui élimine
        checkCollisions(): void {
            store.dispatchCheckCollisions();   // ton withActions branché sur l'action
        },
    }))
);
