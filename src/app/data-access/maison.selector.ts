import { Selector } from '@ngxs/store';
import { CellStateModel } from './maison.model';
import { CellState } from './maison.state';

export class CellSelectors {
    @Selector([CellState])
    static items(state: CellStateModel) {
        return state?.items;
    }

    @Selector([CellState])
    static doneItems(state: CellStateModel) {
        return state?.items.filter((it) => !it.isVisited);
    }

    @Selector([CellState])
    static activeItems(state: CellStateModel) {
        return state?.items.filter((it) => it.isVisited);
    }
}
