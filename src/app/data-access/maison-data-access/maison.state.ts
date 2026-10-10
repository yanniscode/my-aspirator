import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { CellElement, CellsStateModel, newCell, newDefaultCell } from './maison.model';
import { AddCell, GetCellAtPosition, InitMaison, UpdateCellByItsPosition, UpdateCellReserved, UpdateCellType, UpdateCellVisited } from './maison.actions';
import { GridPosition } from '../../classes/models/grid-position';

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
    initMaison(ctx: StateContext<CellsStateModel>, action: InitMaison): void {
        const state = ctx.getState();
        const obstacleKeys = new Set(action.obstacles.map(o => `${o.row},${o.col}`));

        // Construction complète en mémoire, UN SEUL setState
        const items: CellElement[] = [];
        for (let row = 0; row < action.rows; row++) {
            for (let col = 0; col < action.cols; col++) {
                items.push(newCell(
                    state.cellId + items.length,
                    new GridPosition(row, col),
                    obstacleKeys.has(`${row},${col}`) ? 'X' : 'O'
                ));
            }
        }

        ctx.setState({
            ...state,
            items,                                   // remplace, pas de concat successifs
            rows: action.rows,
            cols: action.cols,
            obstacles: action.obstacles,
            cellId: state.cellId + items.length,      // avancer le compteur d'ID
        });
    }

    @Action(AddCell)
    addCell(ctx: StateContext<CellsStateModel>, action: AddCell): void {
        const state = ctx.getState();

        ctx.setState({
            ...state,
            items: [...state.items, newCell(state.cellId, action.position, action.cellType)],
            cellId: state.cellId + 1,
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
