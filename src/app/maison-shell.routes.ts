import { Route } from '@angular/router';
import { provideStates } from '@ngxs/store';
import { AppComponent } from './components/app.component';
import { CellState } from './data-access/maison-data-access/maison.state';
import { RobotState } from './data-access/robot-data-access/robot.state';

export const maisonRoutes: Route[] = [
    {
        path: '',
        providers: [provideStates([CellState, RobotState])],
        component: AppComponent,
    },
];
