import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { CellModel, CellStateModel } from './maison.model';
import { AddCell, ChangeStatus } from './maison.actions';

@State<CellStateModel>({
    name: 'cell',
    defaults: {
        items: [],
    },
})
@Injectable()
export class CellState {
    @Action(AddCell)
    addCell(ctx: StateContext<CellStateModel>, action: AddCell) {
        const state = ctx.getState();

        const newItem: CellModel = {
            id: Math.floor(Math.random() * 1000),
            cellName: action.cellName,
            isVisited: true,
        };

        ctx.setState({
            ...state,
            items: [...state.items, newItem],
        });
    }

    @Action(ChangeStatus)
    test(ctx: StateContext<CellStateModel>, action: ChangeStatus) {
        const state = ctx.getState();

        const items = state.items.map((item) =>
            item.id === action.cellId ? { ...item, isVisited: action.status } : item
        );

        ctx.setState({
            ...state,
            items,
        });
    }
}
