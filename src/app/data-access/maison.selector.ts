import { CellElement, CellsStateModel } from './maison.model';
import { CellState } from './maison.state';
import { GridPosition } from '../classes/models/grid-position';
import { createSelector, Selector } from '@ngxs/store';

export class CellSelectors {

    // Sélecteur principal : toutes les cellules
    @Selector([CellState])
    static items(state: CellsStateModel): CellElement[] {
        return state?.items;
    }

    // Sélecteur : cellules de type sol ('O' ou '_')
    @Selector([CellSelectors.items])
    static floorItems(items: CellElement[]): CellElement[] {
        return items?.filter(it => it.cellType === 'O' || it.cellType === '_');
    }

    // Sélecteur : cellules non visitées (utilise `floorItems` pour éviter de recalculer)
    @Selector([CellSelectors.floorItems])
    static unVisitedItems(floorItems: CellElement[]): CellElement[] {
        return floorItems?.filter(it => !it.visited);
    }

    // Sélecteur : cellules visitées
    @Selector([CellSelectors.floorItems])
    static visitedItems(floorItems: CellElement[]): CellElement[] {
        return floorItems?.filter((it) => it.visited);
    }

    // Sélecteur : cellules réservées (utilise `floorItems` pour éviter de recalculer)
    @Selector([CellSelectors.floorItems])
    static reservedItems(floorItems: CellElement[]): CellElement[] {
        return floorItems?.filter(it => it.reserved);
    }

    // Sélecteur paramétré : cellule par position
    // Utilise `createSelector` car `@Selector` ne gère pas les paramètres
    static cellByPosition(position: GridPosition) {
        return createSelector(
            [CellSelectors.items],
            (items: CellElement[]) => {
                return items.find(cell =>
                    cell.position.col === position.col &&
                    cell.position.row === position.row
                );
            }
        );
    }
}
