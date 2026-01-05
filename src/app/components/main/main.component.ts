import { Component, OnDestroy, ViewChild, ViewEncapsulation, inject, Signal, computed, ChangeDetectionStrategy, effect, signal, AfterContentInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

import { MaisonService } from '../../services/maison-service/maison.service';

import { MaisonComponent } from '../maison/maison.component';
import { MessagesComponent } from '../messages/messages.component';

import { MaisonModel } from '../../classes/models/maison-model';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MessageService } from '../../services/message-service/message.service';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/robot-actions-service/robot-aspirator-with-next-positions-tab-service/robot-aspirator/robot-aspirator/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';
import { RobotAspiratorDataService } from '../../services/robot-aspirator-data-service/robot-aspirator-data.service';
import { DecimalPipe } from '@angular/common';
import { Position } from '../../classes/models/position';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [FormsModule, TableModule, MessagesComponent, MaisonComponent,
    DecimalPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default, // ATTENTION: ChangeDetectionStrategy.OnPush pourrait poser problème lors de l'affichage de la maison en intro
  providers: [RobotAspiratorWithNextPositionsTabService]
})
export class MainComponent implements AfterContentInit, OnDestroy {
  // instantiation de composant enfant
  @ViewChild(MaisonComponent) maisonChildComponent!: MaisonComponent;

  private messageService = inject(MessageService);
  private maisonService = inject(MaisonService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  public maisonModel: MaisonModel;
  public robotModelsTab: RobotAspiratorModel[];

  // Map pour stocker les signaux computed de chaque robot à afficher
  private robotDataViewSignals = new Map<string, Signal<RobotAspiratorModel | undefined>>();

  private isRobotMapStarted: boolean = false;

  // attendre l'initialisation des robots avant de déclencher effect()
  private areRobotsInitialized = signal(false);

  constructor() {
    console.log("MainComponent - constructor()");

    // initialisation des params de la maison et des robots
    this.maisonModel = { ...this.maisonService.getMaisonParams() };
    this.robotModelsTab = [...this.robotAspiratorDataService.getRobotsParams()];

    this.isRobotMapStarted = false;

    effect(() => {
      // Réagir à TOUS les robots
      console.log("MainComponent constructor() - effect()");

      // N'exécuter que si initialisé - nécessaire pour déclencher l'animation du déplacement (marche pas sans, actuellement)
      if (!this.areRobotsInitialized()) return;

      this.updateAllRobotViews();
    });
  }

  private updateAllRobotViews(): void {
    console.log('MainComponent - updateAllRobotViews()');

    this.robotDataViewSignals.forEach((robotSignal) => {
      const robot = robotSignal();
      if (robot) {
        console.log(robot);
        this.updateView(robot);
      }
    });
  }

  // évite une ExpressionChangedAfterItHasBeenCheckedError
  ngAfterContentInit(): void {
    console.log('MainComponent - ngAfterContentInit()');

    // mini-delai pour attendre la fin de l'initialisation de l'enfant MaisonComponent
    setTimeout(() => {
      this.maisonChildComponent.construireMaison(this.maisonModel);
    });
    this.initRobotsDatas();

    this.areRobotsInitialized.set(true);
  }

  ngOnDestroy(): void {
    console.log('MainComponent - ngOnDestroy()');
    this.robotModelsTab.forEach(robotModel => {
      this.robotAspiratorDataService.unregisterRobotFromList(robotModel.robotName);
    });
    console.log(`Nettoyage du composant Maison - ${this.robotModelsTab.length} robots`);

    this.robotDataViewSignals.clear();
  }

  private initRobotsDatas(): void {
    console.log("MainComponent - initRobotsDatas()");

    this.robotModelsTab.forEach((robotModel: RobotAspiratorModel) => {
      // 1/ ajout du robot à la liste:
      this.robotAspiratorDataService.registerRobotInList(robotModel);
      // 2/ créer un signal computed pour chaque robot
      this.createRobotSignal(robotModel.robotName);
      // 3/ Ajout de la base du robot dans la Maison
      const robotBasePosition: Position = { ...robotModel.basePosition };
      this.maisonModel = { ...this.maisonService.updateMaisonConfig(this.maisonModel, robotBasePosition) };
    });
  }

  /**
  * Crée un signal computed pour un robot spécifique dans le composant appelant le service
  */
  private createRobotSignal(robotName: string): void {
    console.log("MainComponent - createRobotSignal()");

    const robotSignal: Signal<RobotAspiratorModel> | undefined = this.robotAspiratorDataService.getRobotSignal(robotName);
    if (!robotSignal) return;

    this.robotDataViewSignals.set(robotName, robotSignal);
  }

  /**
  * Update de la vue (maison et robots)
  */
  private updateView(robot: RobotAspiratorModel): void {
    console.log("MainComponent - updateView()");

    this.maisonChildComponent.updateMaisonWithRobot(robot);
    this.maisonService.updateMaisonCellules(this.maisonModel, robot.lastPosition);
  }

  /**
  * Getter sur le signal d'un robot : utilisé par le template
  */
  public getRobotDataView(robotName: string): Signal<RobotAspiratorModel | undefined> {
    console.log("MainComponent - getRobotDataView()");

    return this.robotDataViewSignals.get(robotName) || computed(() => undefined);
  }

  public pause(): void {
    console.log("MainComponent - pause");

    if (this.isRobotMapStarted) {
      this.robotAspiratorDataService.onRobotPause();
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  public start(): void {
    console.log("MainComponent - start()");

    // Démarrage avec des signaux:
    if (!this.isRobotMapStarted) {
      this.robotAspiratorDataService.startRobotsMapInterval(this.maisonModel);
      this.isRobotMapStarted = true;
    } else {
      console.log("(re)démarrage impossible");
    }
  }

  private log(message: string) {
    this.messageService.add(`MainComponent: ${message}`);
  }
}
