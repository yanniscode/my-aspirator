import { signalStoreFeature, withComputed, withMethods } from '@ngrx/signals';
import {
    createSelectMap,
    SelectorMap,
    createDispatchMap,
    ActionMap,
} from '@ngxs/store';

export function withSelectors<T extends SelectorMap>(selectorMap: T) {
    return signalStoreFeature(withComputed(() => createSelectMap(selectorMap)));
}

export function withActions<T extends ActionMap>(actionMap: T) {
    return signalStoreFeature(withMethods(() => createDispatchMap(actionMap)));
}
