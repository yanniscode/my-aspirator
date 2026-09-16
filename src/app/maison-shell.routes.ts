import { Route } from '@angular/router';
import { provideStates } from '@ngxs/store';
import { CellState } from './data-access/maison.state';
import { AppComponent } from './components/app.component';

export const maisonRoutes: Route[] = [
    {
        path: '',
        providers: [provideStates([CellState])],
        component: AppComponent,
    },
];
