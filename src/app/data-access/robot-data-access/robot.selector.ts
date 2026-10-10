import { Selector } from "@ngxs/store";
import { RobotsStateModel, RobotStateItem } from "./robot.model";
import { RobotState } from "./robot.state";

export class RobotSelectors {

    // Sélecteur principal : tous les robots
    @Selector([RobotState])
    static items(state: RobotsStateModel): RobotStateItem[] {
        return state?.items;
    }
}
