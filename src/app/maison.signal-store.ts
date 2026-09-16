import { signalStore, withComputed, withHooks } from '@ngrx/signals';
import { withActions, withSelectors } from '../shared/ngxs.utils';
import { AddCell, ChangeStatus } from './data-access/maison.actions';
import { CellSelectors } from './data-access/maison.selector';
import { DestroyRef, computed, inject } from '@angular/core';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const CellStore = signalStore(
    withSelectors({
        cells: CellSelectors.items,
    }),
    withActions({
        addCell: AddCell,
        changeStatus: ChangeStatus,
    }),
    withComputed((store) => ({
        cellsCount: computed(() => store?.cells()?.length),
    })),
    withHooks({
        onInit(
            { cellsCount },
            actions$ = inject(Actions),
            destroyRef = inject(DestroyRef),
            toastrService = inject(ToastrService)
        ): void {
            actions$
                .pipe(
                    ofActionSuccessful(AddCell),
                    tap({
                        next: () => {
                            toastrService.info(`Cell Added! Total count: ${cellsCount()}`);
                        },
                    }),
                    takeUntilDestroyed(destroyRef)
                )
                .subscribe();
        },
    })
);
