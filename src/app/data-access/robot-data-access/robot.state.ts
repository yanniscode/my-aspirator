import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { RobotsStateModel } from "./robot.model";
import { InitRobotsList } from "./robot.actions";

@State<RobotsStateModel>({
    name: 'robots', // Nom du slice dans le store
    defaults: {
        items: [],
    },
})
@Injectable()
export class RobotState {

    // cf: setRobotSignalsList()
    @Action(InitRobotsList)
    initRobotsList(ctx: StateContext<RobotsStateModel>, action: InitRobotsList) {
        ctx.patchState({ items: action.items });
    }

}
