import { Component, OnDestroy, ViewChild, ViewEncapsulation, inject, ChangeDetectionStrategy, computed, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { GameComponent } from '../game-component/game.component';
import { MessagesComponent } from '../messages-component/messages.component';
import { MaisonModel } from '../../classes/models/maison-model';
import { LoggerService } from '../../services/data-services/logger-service/logger.service';
import { MaisonDataNettoyageService } from '../../services/data-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { RobotDataService } from '../../services/data-services/robot-data-services/robot-data.service';
import { RobotModel } from '../../classes/models/robot-model';
import { RobotFactoryService } from '../../services/factory-services/robot-factory-service/robot-factory.service';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/action-services/robot-action-services/robot-aspirator-with-next-positions-tab-service/robot-aspirator/robot-aspirator/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';

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
export class MainComponent implements OnDestroy {
  // instantiation de composant enfant
  @ViewChild(GameComponent) maisonChildComponent!: GameComponent;

  private maisonNettoyageService = inject(MaisonDataNettoyageService);
  public robotDataService = inject(RobotDataService);
  private robotFactoryService = inject(RobotFactoryService);
  private loggerService = inject(LoggerService);

  private TYPE_ACTION_ROBOT = "";

  // pour le template
  public readonly maisonViewModel: Signal<MaisonModel> = computed(() =>
    this.maisonNettoyageService.maisonSignal()
  );

  private readonly _robotSignals: Map<string, Signal<RobotModel>> = this.robotDataService.robotSignals;
  // Signal computed qui expose les valeurs de la Map de robots sous forme de tableau
  public readonly robotList: Signal<RobotModel[]> = computed(() =>
    Array.from(this._robotSignals.values()).map(signal => signal())
  );

  public robotViewModelTab: RobotModel[];
  public robotNames = signal<string[]>([]);

  private isRobotMapStarted: boolean = false;

  constructor() {
    console.log("MainComponent - constructor()");
    this.TYPE_ACTION_ROBOT = "aspirator";

    // initialisation des params de la maison et des robots
    const maisonModel: MaisonModel = { ...this.maisonNettoyageService.getMaisonParams() };
    this.maisonNettoyageService.initMaison(maisonModel);

    this.robotViewModelTab = [...this.robotFactoryService.getRobotsParams(this.TYPE_ACTION_ROBOT)];
    this.isRobotMapStarted = false;
    this.robotNames = this.robotFactoryService.setRobotListSignals(this.robotViewModelTab);
    if (!this.robotNames) return;
  }

  public ngOnDestroy(): void {
    console.log('MainComponent - ngOnDestroy()');
    this.robotViewModelTab.forEach(robotModel => {
      this.robotDataService.unregisterRobotFromList(robotModel.robotName);
    });
    console.log(`Nettoyage du composant Maison - ${this.robotViewModelTab.length} robots`);
  }

  public pause(): void {
    console.log("MainComponent - pause");

    if (this.isRobotMapStarted) {
      this.robotFactoryService.pauseAnimationService(this.TYPE_ACTION_ROBOT);
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  public start(): void {
    console.log("MainComponent - start()");

    // Démarrage avec des signaux:
    if (!this.isRobotMapStarted) {
      this.robotFactoryService.declencheAnimationService(this.TYPE_ACTION_ROBOT);
      this.isRobotMapStarted = true;
    } else {
      console.log("(re)démarrage impossible");
    }
  }

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
