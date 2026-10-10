import { signalStore, withComputed } from "@ngrx/signals";
import { withActions, withSelectors } from "../shared/ngxs.utils";
import { RobotSelectors } from "./data-access/robot-data-access/robot.selector";
import { InitRobotsList } from "./data-access/robot-data-access/robot.actions";
import { computed } from "@angular/core";

export const CellStore = signalStore(
    { providedIn: 'root' },
    withSelectors({
        robots: RobotSelectors.items,
    }),
    withActions({
        initRobotsList: InitRobotsList,
    }),
    withComputed((store) => ({
        robotsCount: computed(() => store.robots()?.length),
    })),
);
