import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

import { MaisonService } from '../../services/maison-service/maison.service';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';

import { MaisonComponent } from '../maison/maison.component';
import { MessagesComponent } from '../messages/messages.component';

import { MaisonModel } from '../../classes/models/maison-model';
import { Position } from '../../classes/models/position';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MessageService } from '../../services/message-service/message.service';

@Component({
  selector: 'app-main',
  imports: [CommonModule, FormsModule, TableModule, MessagesComponent, MaisonComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  encapsulation: ViewEncapsulation.None,
  providers: [RobotAspiratorService] // TODO: Chaque instance aura son propre service > VOIR POUR MaisonService
})
export class MainComponent implements AfterViewInit, OnInit {
  // instantiation du composants enfant
  @ViewChild(MaisonComponent) maisonChildComponent!: MaisonComponent;

  public maisonModel: MaisonModel;
  private robotModelsTab: RobotAspiratorModel[];

  constructor(private messageService: MessageService, private maisonService: MaisonService, private robotAspiratorService: RobotAspiratorService) {
    console.log("MaisonComponent constructor()");

    // initialisation des params de la maison
    this.maisonModel = new MaisonModel();
    this.maisonModel.largeurMaison = 10;
    this.maisonModel.hauteurMaison = 8;
    this.maisonModel.obstacles = [];
    this.maisonModel.isNettoyageComplete = false;

    // initialisation des robots:
    this.robotModelsTab = [];
  }

  ngOnInit(): void {
    console.log('MainComponent ngOnInit() maisonComponent:', this.maisonChildComponent);

    // Attendre que la vue soit complètement initialisée

    // setTimeout(() => {
    //   if (this.maisonChildComponent) {
    //     this.startIntro();
    //   }
    // }, 100);
  }

  ngAfterViewInit() {
    // TODO: garder ? voir si startIntro() possible ici ?
    // Maintenant vous pouvez utiliser robotAspiratorComponents
    console.log('MainComponent ngAfterViewInit() maisonComponent:', this.maisonChildComponent);

    // setTimeout() pour éviter l'erreur: "ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked.""
    setTimeout(() => {
      if (this.maisonChildComponent) {
        this.startIntro();
      }
    }, 0);
  }

  public startIntro(): void {
    console.log("MainComponent startIntro()");

    this.maisonModel = { ...this.maisonService.getMaisonParams() };

    this.maisonChildComponent.construireMaison(this.maisonModel);

    // TODO: revoir condition isRobotStarted pour les 2 robots (ou tous...) : possible de passer la vérif dans getRobotsParams()
    // if (this.robot1Model.isRobotStarted === false) {
    // setTimeout(() => {
    this.robotModelsTab = { ...this.robotAspiratorService.getRobotsParams() };

    for (let robotIndex in this.robotModelsTab) {
      const robotBasePosition: Position = { ...this.robotModelsTab[robotIndex].basePosition };

      this.maisonModel = { ...this.maisonService.updateMaisonConfig(this.maisonModel, robotBasePosition) };
    }
    // }, 1000);
    // }
  }

  public pause(): void {
    console.log("pause()");
    // TODO: la maison se charge de mettre en pause ses composant enfant (robots)
    this.robotModelsTab = this.maisonChildComponent.onMaisonPause(this.robotModelsTab);
  }

  public start(): void {
    console.log("start()");
    this.robotModelsTab = this.maisonChildComponent.onMaisonStart(this.maisonModel, this.robotModelsTab);
  }

  private log(message: string) {
    this.messageService.add(`MainComponent: ${message}`);
  }
}
