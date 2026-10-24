import { signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withActions, withSelectors } from '../../shared/ngxs.utils';
import { DestroyRef, computed, inject } from '@angular/core';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { GridPosition } from '../classes/models/grid-position';
import { CellElement, newDefaultCell } from '../data-access/maison-data-access/maison.model';
import { CellSelectors } from '../data-access/maison-data-access/maison.selector';
import { InitMaison, AddCell, UpdateCellByItsPosition, UpdateCellType, UpdateCellVisited, UpdateCellReserved } from '../data-access/maison-data-access/maison.actions';
import { PixelPosition } from '../classes/models/pixel-position';

export const CellStore = signalStore(
    { providedIn: 'root' },
    withSelectors({
        cells: CellSelectors.items,
        rows: CellSelectors.rows,
        cols: CellSelectors.cols,
        obstacles: CellSelectors.obstacles,
        floorItems: CellSelectors.floorItems ?? [],
        unVisitedCells: CellSelectors.unVisitedItems ?? [],
        visitedCells: CellSelectors.visitedItems ?? [],
        reservedCells: CellSelectors.reservedItems ?? [],
    }),
    withMethods((store) => ({
        cellAtPosition(position: GridPosition): CellElement | undefined {
            return store.cells().find(
                (cell) =>
                    cell.position.col === position.col &&
                    cell.position.row === position.row
            );
        },
        calculatePixelCoordinates(gridPosition: GridPosition): PixelPosition {
            const PIXELS_PER_STEP: number = 50; // Pixels à parcourir dans un intervale donné
            return new PixelPosition(
                gridPosition.col * PIXELS_PER_STEP,  // col → x (left)
                gridPosition.row * PIXELS_PER_STEP   // row → y (top)
            );
        },
    })),
    withActions({
        initMaison: InitMaison,
        addCell: AddCell,
        updateCellByItsPosition: UpdateCellByItsPosition,
        updateCellType: UpdateCellType,
        updateCellVisited: UpdateCellVisited,
        updateCellReserved: UpdateCellReserved,
    }),
    withComputed((store) => ({
        cellsCount: computed(() => store.cells().length),
        floorCellsCount: computed(() => store.floorItems().length),
        unVisitedCellsCount: computed(() => store.unVisitedCells().length),
        visitedCellsCount: computed(() => store.visitedCells().length),
        reservedCellsCount: computed(() => store.reservedCells().length),
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
        visitedCountByVisitor: computed(() => {
            // Map<robotName, nombre de cases visitées> — recalculée seulement si les cellules changent
            const counts = new Map<string, number>();
            for (const cell of store.visitedCells()) {
                if (cell.visitorName != null) {
                    counts.set(cell.visitorName, (counts.get(cell.visitorName) ?? 0) + 1);
                }
            }
            return counts;
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
