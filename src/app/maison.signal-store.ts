import { signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withActions, withSelectors } from '../shared/ngxs.utils';
import { AddCell, GetCellAtPosition, InitMaison, UpdateCellByItsPosition as UpdateCellByItsPosition, UpdateCellReserved, UpdateCellType, UpdateCellVisited } from './data-access/maison.actions';
import { CellSelectors } from './data-access/maison.selector';
import { DestroyRef, computed, inject } from '@angular/core';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { GridPosition } from './classes/models/grid-position';
import { CellElement, newDefaultCell } from './classes/models/maison-model/maison.model';

export const CellStore = signalStore(
    { providedIn: 'root' },
    withSelectors({
        cells: CellSelectors.items,
        rows: CellSelectors.rows,
        cols: CellSelectors.cols,
        obstacles: CellSelectors.obstacles
    }),
    withSelectors({
        cellByPosition: CellSelectors.cellByPosition,
    }),
    withSelectors({
        floorItems: CellSelectors.floorItems,
    }),
    withSelectors({
        unVisitedCells: CellSelectors.unVisitedItems,
    }),
    withSelectors({
        visitedCells: CellSelectors.visitedItems,
    }),
    withSelectors({
        reservedCells: CellSelectors.reservedItems,
    }),
    withMethods((store) => ({
        cellAtPosition(position: GridPosition): CellElement | undefined {
            return store.cells()?.find(
                (cell) =>
                    cell.position.col === position.col &&
                    cell.position.row === position.row
            );
        },
    })),
    withActions({
        initMaison: InitMaison,
        addCell: AddCell,
        getCellAtPosition: GetCellAtPosition,
        updateCellByItsPosition: UpdateCellByItsPosition,
        updateCellType: UpdateCellType,
        updateCellVisited: UpdateCellVisited,
        updateCellReserved: UpdateCellReserved,
    }),
    withComputed((store) => ({
        cellsCount: computed(() => store.cells()?.length),
    })),
    withComputed((store) => ({
        floorCellsCount: computed(() => store?.floorItems()?.length),
    })),
    withComputed((store) => ({
        unVisitedCellsCount: computed(() => store?.unVisitedCells()?.length),
    })),
    withComputed((store) => ({
        visitedCellsCount: computed(() => store?.visitedCells()?.length),
    })),
    withComputed((store) => ({
        reservedCellsCount: computed(() => store?.reservedCells()?.length),
    })),
    withComputed((store) => ({
        // Grille 2D : grid [row][col]
        maisonGrid: computed(() => {
            const cells = store.cells();
            const rows = store.rows();
            const cols = store.cols();
            const obstacles = store.obstacles();

            if (!cells || cells.length === 0) return [] as CellElement[][];

            const obstacleKeys = new Set(obstacles.map(o => `${o.row},${o.col}`));

            // Initialisation avec des cellules par défaut
            const grid: CellElement[][] = Array.from(
                { length: rows },
                (_, row) => Array.from(
                    { length: cols },
                    (_, col) => newDefaultCell(
                        row,
                        col,
                        obstacleKeys.has(`${row},${col}`) ? 'X' : 'O'
                    )
                )
            );

            for (const cell of cells) {
                grid[cell.position.row][cell.position.col] = cell;
            }
            return grid;
        }),
    })),
    withHooks({
        onInit(
            { cellsCount, visitedCellsCount, reservedCellsCount },
            actions$ = inject(Actions),
            destroyRef = inject(DestroyRef),
        ): void {
            actions$
                .pipe(
                    ofActionSuccessful(AddCell),
                    tap({
                        next: () => {
                            console.log(`Cell Added! Total count: ${cellsCount()}`);
                        },
                    }),
                    takeUntilDestroyed(destroyRef)
                )
                .subscribe();

            actions$
                .pipe(
                    ofActionSuccessful(UpdateCellVisited),
                    tap({
                        next: () => {
                            console.log(`Cell Visited! Total visited count: ${visitedCellsCount()}`);
                        },
                    }),
                    takeUntilDestroyed(destroyRef)
                )
                .subscribe();

            actions$
                .pipe(
                    ofActionSuccessful(UpdateCellReserved),
                    tap({
                        next: () => {
                            console.log(`Cell Reserved! Total reserved count: ${reservedCellsCount()}`);
                        },
                    }),
                    takeUntilDestroyed(destroyRef)
                )
                .subscribe();
        },
    })
);
