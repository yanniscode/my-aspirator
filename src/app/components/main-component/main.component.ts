import { Component, OnDestroy, ViewChild, ViewEncapsulation, inject, ChangeDetectionStrategy, computed, Signal, signal, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { GameComponent } from '../game-component/game.component';
import { MessagesComponent } from '../messages-component/messages.component';
import { MaisonModel } from '../../classes/models/maison-model';
import { LoggerService } from '../../services/main-services/logger-service/logger.service';
import { RobotModel } from '../../classes/models/robot-model';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/robot-services/robot-algos-deplacement-services/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';
import { RobotDataFactoryService } from '../../services/robot-services/robot-data-factory-service/robot-data-factory.service';
import { MaisonDataFactoryService } from '../../services/maison-services/maison-data-factory-service/maison-data-factory.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    GameComponent, MessagesComponent, FormsModule, TableModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default, // ATTENTION: ChangeDetectionStrategy.OnPush pourrait poser problème lors de l'affichage de la maison en intro
  providers: [RobotAspiratorWithNextPositionsTabService]
})
export class MainComponent implements AfterViewInit, OnDestroy {
  // instantiation de composant enfant
  @ViewChild(GameComponent) maisonChildComponent!: GameComponent;

  private gameComponent: GameComponent;

  private maisonDataFactoryService = inject(MaisonDataFactoryService);
  // appel dans le template du service, donc public:
  public robotDataFactoryService = inject(RobotDataFactoryService);
  private loggerService = inject(LoggerService);

  // pour le template
  public readonly maisonViewModel: Signal<MaisonModel> = this.maisonDataFactoryService.getMaisonSignal();

  // on récupère la liste de signals à partir de la factory de robots dans un type générique (RobotModel)
  private readonly _robotSignals: Map<string, Signal<RobotModel>> = this.robotDataFactoryService.getRobotSignalsList();
  // Signal computed qui expose les valeurs de la Map de robots sous forme de tableau
  public readonly robotList: Signal<RobotModel[]> = computed(() =>
    Array.from(this._robotSignals.values()).map(signal => signal())
  );

  public robotViewModelTab: RobotModel[];
  public robotNames = signal<string[]>([]);

  private isRobotMapStarted: boolean = false;

  constructor() {
    console.log("MainComponent - constructor()");
    this.gameComponent = this.maisonChildComponent;

    // initialisation des params de la maison et des robots
    this.maisonDataFactoryService.setMaisonParams();

    this.robotViewModelTab = [...this.robotDataFactoryService.getRobotsParams()];
    this.isRobotMapStarted = false;
    this.robotNames = this.robotDataFactoryService.setRobotSignalsList(this.robotViewModelTab);
    if (!this.robotNames) return;
  }

  ngAfterViewInit(): void {
    console.log("MainComponent - ngAfterViewInit()");

    this.gameComponent = this.maisonChildComponent;
  }

  ngOnDestroy(): void {
    console.log('MainComponent - ngOnDestroy()');

    this.robotViewModelTab.forEach(robotModel => {
      this.robotDataFactoryService.unregisterRobotFromList(robotModel.robotName);
    });
    console.log(`Nettoyage du composant Maison - ${this.robotViewModelTab.length} robots`);
  }

  public pause(): void {
    console.log("MainComponent - pause");

    if (this.isRobotMapStarted) {
      this.gameComponent.onPause();
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  public start(): void {
    console.log("MainComponent - start()");

    // Démarrage avec des signaux:
    if (!this.isRobotMapStarted) {
      this.gameComponent.onStart();
      this.isRobotMapStarted = true;
    } else {
      console.log("(re)démarrage impossible");
    }
  }

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
