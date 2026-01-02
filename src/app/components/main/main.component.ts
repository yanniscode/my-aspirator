import { Component, OnDestroy, ViewChild, ViewEncapsulation, inject, Signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
export class MainComponent implements OnDestroy {

  // instantiation du composants enfant
  @ViewChild(MaisonComponent) maisonChildComponent!: MaisonComponent;

  private messageService = inject(MessageService);
  private maisonService = inject(MaisonService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  public maisonModel: MaisonModel;
  public robotModelsTab: RobotAspiratorModel[];

  // Map pour stocker les signaux computed de chaque robot à afficher
  private robotDataViewSignals = new Map<string, Signal<RobotAspiratorModel | undefined>>();

  private isRobotMapStarted: boolean = false;

  constructor() {
    console.log("MainComponent constructor()");

    // initialisation des params de la maison
    this.maisonModel = { ...this.maisonService.getMaisonParams() };

    // initialisation des params du ou des robots
    this.robotModelsTab = [...this.robotAspiratorDataService.getRobotsParams()];

    this.isRobotMapStarted = false;

    // Attendre que la vue soit complètement initialisée
    setTimeout(() => {
      // if (this.maisonChildComponent) {
      this.initDatas();
      // }
    });
  }

  ngOnDestroy(): void {
    console.log('MainComponent - ngOnDestroy()');
    console.log(`🧹 Nettoyage du composant Maison - ${this.robotModelsTab.length} robots`);

    this.robotModelsTab.forEach(robotModel => {
      this.robotAspiratorDataService.unregisterRobotFromList(robotModel.robotName);
    });
    this.robotDataViewSignals.clear();
  }

  // Ancienne méthode : startIntro()
  private initDatas(): void {
    console.log("MaisonComponent - initDatas()");

    this.maisonChildComponent.construireMaison(this.maisonModel);

    this.robotModelsTab.forEach((robotModel: RobotAspiratorModel) => {
      const robotBasePosition: Position = { ...robotModel.basePosition };

      // 1/ ajout du robot à la liste:
      this.robotAspiratorDataService.registerRobotInList(robotModel);
      // 2/ créer un signal computed pour chaque robot
      this.createRobotSignal(robotModel.robotName);

      this.maisonModel = { ...this.maisonService.updateMaisonConfig(this.maisonModel, robotBasePosition) };
    });
  }

  /**
  * Crée un signal computed pour un robot spécifique dans la classe appelant le service
  */
  private createRobotSignal(robotName: string): void {
    console.log("MainComponent - createRobotSignal()");

    const robotSignal: Signal<RobotAspiratorModel | undefined> = computed(() => {
      console.log("createRobotSignal - computed()");

      // TODO: Mise à jour de la vue ici... correct ? marche
      const robot: RobotAspiratorModel = this.robotAspiratorDataService.getRobot(robotName);

      // Maj actualisée de la position du robot + des cases de la maison
      // TODO: remplacer cet appel pour NG Animation par nouvel update de position du robot avec canvas
      this.maisonChildComponent.updateMaisonWithRobot(robot);
      // this.maisonChildComponent.updateRobotView(robot);

      this.maisonService.updateMaisonCellules(this.maisonModel, robot.lastPosition);

      const signal: Signal<RobotAspiratorModel> | undefined = this.robotAspiratorDataService.getRobotSignal(robotName);
      return signal ? signal() : undefined;
    });
    if (!robotSignal) return;

    this.robotDataViewSignals.set(robotName, robotSignal);
  }

  /**
  * Getter sur le signal d'un robot pour le template
  */
  public getRobotDataView(robotName: string): Signal<RobotAspiratorModel | undefined> {
    console.log("MaisonComponent - getRobotDataView()");

    return this.robotDataViewSignals.get(robotName) || computed(() => undefined);
  }

  public pause(): void {
    console.log("MaisonComponent - pause");

    // TODO: obsolète - la maison met en pause ses composants enfant (robots)
    // this.maisonChildComponent.onMaisonPause(this.robotModelsTab);
    if (this.isRobotMapStarted) {
      this.robotAspiratorDataService.onRobotPause();
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  public start(): void {
    console.log("MaisonComponent - start()");

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
