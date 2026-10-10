import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { CellElement, CellsStateModel } from './maison.model';
import { AddCell, GetCellAtPosition, InitMaison, UpdateCellByItsPosition, UpdateCellReserved, UpdateCellType, UpdateCellVisited } from './maison.actions';

@State<CellsStateModel>({
    name: 'cells', // Nom du slice dans le store
    defaults: {
        items: [],
        cellId: 0, // init
        rows: 8,
        cols: 10,
        obstacles: []
    },
})
@Injectable()
export class CellState {

    @Action(InitMaison)
    initMaison(ctx: StateContext<CellsStateModel>, action: InitMaison) {
        ctx.patchState({ rows: action.rows, cols: action.cols, obstacles: action.obstacles });
    }

    @Action(AddCell)
    addCell(ctx: StateContext<CellsStateModel>, action: AddCell): void {
        const state = ctx.getState();

        const newItem: CellElement = {
            cellId: state.cellId,
            position: action.position,
            cellType: action.cellType,
            visited: false,
            reserved: false
        };

        ctx.setState({
            ...state,
            items: [...state.items, newItem],
            cellId: state.cellId + 1, // ✅ Incrémente cellId
        });
    }

    @Action(GetCellAtPosition)
    getCellAtPosition(ctx: StateContext<CellsStateModel>, action: GetCellAtPosition): CellElement | undefined {
        const state = ctx.getState();

        return state.items.find(cell =>
            cell.position.col === action.position.col &&
            cell.position.row === action.position.row
        );
    }

    @Action(UpdateCellType)
    updateCellType(ctx: StateContext<CellsStateModel>, action: UpdateCellType): void {
        const state: CellsStateModel = ctx.getState();

        const items: CellElement[] = state.items.map(item =>
            item.cellId === action.cellId ? { ...item, cellType: action.cellType } : item
        );

        ctx.setState({
            ...state,
            items, // ✅ Immutabilité
        });
    }

    @Action(UpdateCellVisited)
    updateCellVisited(ctx: StateContext<CellsStateModel>, action: UpdateCellVisited): void {
        const state: CellsStateModel = ctx.getState();

        const items: CellElement[] = state.items.map(item =>
            item.cellId === action.cellId ? { ...item, visited: action.visited } : item
        );

        ctx.setState({
            ...state,
            items, // ✅ Immutabilité
        });
    }

    @Action(UpdateCellReserved)
    updateCellReserved(ctx: StateContext<CellsStateModel>, action: UpdateCellReserved): void {
        const state: CellsStateModel = ctx.getState();

        const items: CellElement[] = state.items.map(item =>
            item.cellId === action.cellId ? { ...item, reserved: action.reserved } : item
        );

        ctx.setState({
            ...state,
            items, // ✅ Immutabilité
        });
    }

    @Action(UpdateCellByItsPosition)
    updateCellByPosition(ctx: StateContext<CellsStateModel>, action: UpdateCellByItsPosition): void {
        const state: CellsStateModel = ctx.getState();

        const items: CellElement[] = state.items.map(item =>
            item.cellId === action.cellId ? { ...item, position: action.position } : item
        );

        ctx.setState({
            ...state,
            items, // ✅ Immutabilité
        });
    }
}
