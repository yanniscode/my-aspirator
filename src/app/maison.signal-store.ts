import { signalStore, withComputed, withHooks } from '@ngrx/signals';
import { withActions, withSelectors } from '../shared/ngxs.utils';
import { AddCell, GetCellByPosition, UpdateCellByPosition as UpdateCellByPosition, UpdateCellReserved, UpdateCellType, UpdateCellVisited } from './data-access/maison.actions';
import { CellSelectors } from './data-access/maison.selector';
import { DestroyRef, computed, inject } from '@angular/core';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

export const CellStore = signalStore(
    { providedIn: 'root' },
    withSelectors({
        cells: CellSelectors.items,
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
    withActions({
        addCell: AddCell,
        getCellByPosition: GetCellByPosition,
        updateCellByPosition: UpdateCellByPosition,
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
