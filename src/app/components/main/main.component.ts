import { Component, OnDestroy, ViewChild, ViewEncapsulation, inject, ChangeDetectionStrategy, signal, AfterContentInit } from '@angular/core';
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
import { Position } from '../../classes/models/position';
import { RobotAspiratorComponent } from '../robot-aspirator/robot-aspirator.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MaisonComponent, RobotAspiratorComponent, MessagesComponent, FormsModule, TableModule,
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

  public maisonViewModel: MaisonModel;

  public robotViewModelTab: RobotAspiratorModel[];

  public robotNames = signal<string[]>([]);

  // TODO ? transformer en signal animationId
  //   isAnimating = signal(false);
  private isRobotMapStarted: boolean = false;

  // variables de template binding (@input vers le composant robot):

  constructor() {
    console.log("MainComponent - constructor()");

    // initialisation des params de la maison et des robots
    this.maisonViewModel = { ...this.maisonService.getMaisonParams() };
    this.robotViewModelTab = [...this.robotAspiratorDataService.getRobotsParams()];

    this.isRobotMapStarted = false;
  }

  // évite une ExpressionChangedAfterItHasBeenCheckedError
  ngAfterContentInit(): void {
    console.log('MainComponent - ngAfterContentInit()');

    // mini-delai pour attendre la fin de l'initialisation de l'enfant MaisonComponent
    setTimeout(() => {
      if (!this.maisonChildComponent) return;
      this.maisonChildComponent.construireMaison(this.maisonViewModel);

      this.initRobotsViewModelDatas();
    });
  }

  ngOnDestroy(): void {
    console.log('MainComponent - ngOnDestroy()');
    this.robotViewModelTab.forEach(robotModel => {
      this.robotAspiratorDataService.unregisterRobotFromList(robotModel.robotName);
    });
    console.log(`Nettoyage du composant Maison - ${this.robotViewModelTab.length} robots`);
  }

  public pause(): void {
    console.log("MainComponent - pause");

    if (this.isRobotMapStarted) {
      this.robotAspiratorDataService.onRobotsPause();
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  public start(): void {
    console.log("MainComponent - start()");

    // Démarrage avec des signaux:
    if (!this.isRobotMapStarted) {
      this.robotAspiratorDataService.startRobotsMapInterval(this.maisonViewModel);
      this.isRobotMapStarted = true;
    } else {
      console.log("(re)démarrage impossible");
    }
  }

  private initRobotsViewModelDatas(): void {
    console.log("MainComponent - initRobotsViewModelDatas()");

    this.robotViewModelTab.forEach((robotViewModel: RobotAspiratorModel) => {
      // 1/ ajout du robot à la liste:
      this.robotAspiratorDataService.registerRobotInList(robotViewModel);

      // 2/ enregistrer le nom de chaque robot dans la liste de robotNames pour le template binding:
      this.robotNames.update(robotNames => [...robotNames, robotViewModel.robotName]);

      // 3/ Ajout de la base du robot dans la Maison
      const robotBasePosition: Position = { ...robotViewModel.basePosition };
      this.maisonViewModel = { ...this.maisonService.updateMaisonConfig(robotBasePosition) };
    });
  }

  private log(message: string) {
    this.messageService.add(`MainComponent: ${message}`);
  }
}
