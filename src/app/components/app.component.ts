import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, state, style, animate } from '@angular/animations';
import { Subscription } from "rxjs";
import { TableModule } from 'primeng/table';

import { MessageService } from '../services/message.service';

import { Position } from '../classes/position';
import { MessagesComponent } from "../messages/messages.component";
import { RobotAspiratorComponent } from './robot-aspirator/robot-aspirator.component';
import { RobotAspiratorModel } from '../classes/robot-aspirator-model';
import { MaisonComponent } from "./maison/maison.component";

@Component({
  selector: 'app-root',
  standalone: true, // Composant autonome
  imports: [CommonModule, FormsModule, TableModule, RobotAspiratorComponent, MessagesComponent, MaisonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('moveRobot1', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: 0, y: 0 + 82 } }), // décalage de Y de 32 pour le robot
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'interval au nuveau service pour anim plus régulière
      ]),
    ]),
    trigger('moveRobot2', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: 450, y: 0 + 82 } }), // décalage de Y de 32 pour le robot
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'interval au nuveau service pour anim plus régulière
      ]),
    ])
  ]
})
export class AppComponent implements OnDestroy, OnInit {
  // instantiation des composants enfants (un par robot)
  @ViewChild(MaisonComponent) maisonComponent!: MaisonComponent;
  @ViewChildren(RobotAspiratorComponent) robotAspiratorComponents!: QueryList<RobotAspiratorComponent>;

  // test du déplacement au clic
  // toggleAnimation() {
  //   console.log("toogle anim");
  //   this.aspiroDirX = 50;
  //   this.aspiroDirY = 0;
  //   this.aspiroX += this.aspiroDirX;
  //   this.aspiroY += this.aspiroDirY;

  //   console.log(this.aspiroX);
  //   console.log(this.aspiroY);
  //   this.moveTrigger++;
  // }

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  // le robot peut être initialisé ou non
  private robot1View: RobotAspiratorModel;
  private robot2View: RobotAspiratorModel;

  private lastPosition: Position;
  private position: Position;
  private batterie: number;
  // méthodes pour l'envoi au composant enfant RobotAspiratorComponent
  public currentRobotLastPosition() {
    return this.lastPosition;
  }
  public currentRobotPosition() {
    return this.position;
  }
  public currentRobotBatterie() {
    return this.batterie;
  }

  // Variables pour la mise à jour de la Vue (public car appelées par le template)
  // Position robot 1
  public aspiroX1: number;
  // ajout d'un décalage du robot au départ  Y += 82:
  public aspiroY1: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger1: number;

  // Position robot 2
  public aspiroX2: number = 0;
  // ajout d'un décalage du robot au départ  Y += 82px:
  public aspiroY2: number = 0 + 82;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger2: number;

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

  constructor(private messageService: MessageService) {
    this.messageService = messageService;

    this.robot1View = new RobotAspiratorModel();
    this.robot2View = new RobotAspiratorModel();

    // valeurs par défaut pour l'initialisation du robot:
    this.lastPosition = { x: -2, y: -2 };
    this.position = { x: -1, y: -1 };
    this.batterie = -1;

    this.aspiroX1 = 0;
    this.aspiroY1 = 0 + 82;
    this.moveTrigger1 = 0;

    this.aspiroX2 = 450;
    this.aspiroY2 = 0 + 82;
    this.moveTrigger2 = 0;
  }

  ngOnInit(): void {
    console.log('maisonComponent:', this.maisonComponent);
    console.log('Nombre de robots:', this.robotAspiratorComponents?.length);

    // Attendre que la vue soit complètement initialisée
    setTimeout(() => {
      if (this.maisonComponent) {
        this.startIntro();
      }
    }, 100);
  }

  ngAfterViewInit() {
  // TODO: garder ? voir si startIntro() possible ici ?
    // Maintenant vous pouvez utiliser robotAspiratorComponents
    console.log('maisonComponent:', this.maisonComponent);
    console.log('Nombre de robots:', this.robotAspiratorComponents.length);
  }

  ngOnDestroy(): void {
    // réinitialisation du déplacement du robot
    this.moveTrigger1 = 0;
    this.moveTrigger2 = 0;
    // Se désabonner pour éviter les fuites de mémoire
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public startIntro(): void {
    // Création de la maison
    this.maisonComponent.initMaisonConfig();
    this.maisonComponent.creerMaison();

    setTimeout(() => {
      // instantiation du robot
      console.log("this.robot1 :");
      console.log(this.robot1View);
      // TODO: revoir condition
      if (this.robot1View.isRobotStarted === false) {
        console.log(this.robot1View.isRobotStarted === false);

        // initialisation des caractéristiques du robot (utilisées ici par la Vue)
        // TODO: garder ?
        this.lastPosition = { x: 0, y: 0 };
        this.position = { ...this.lastPosition };
        this.batterie = 0;

        // initialisation du robot et passage de ses caractéristiques
        this.robot1View = new RobotAspiratorModel();
        this.robot1View.robotName = "robot1";
        this.robot1View.basePosition = { x: 0, y: 0 };
        // au départ, le robot est à la base:
        this.robot1View.lastPosition = { ...this.robot1View.basePosition };
        this.robot1View.position = { ...this.robot1View.basePosition };
        this.robot1View.batterie = 50;

        // init de la base de charge du robot:
        // TODO: revoir inversion x, y:
        this.maisonComponent.maisonModel.maison[this.robot1View.basePosition.y][this.robot1View.basePosition.x].cellStack[0].type = 'B';

        this.aspiroX1 = 0;
        this.aspiroY1 = 0 + 82;
        this.moveTrigger1 = 0

        console.log(this.robot1View);
      }


      // console.log(this.robot2);
      if (this.robot2View.isRobotStarted === false) {
        // initialisation des caractéristiques du robot (utilisées ici par la Vue)
        this.lastPosition = { x: 9, y: 0 };
        this.position = { ...this.lastPosition };
        this.batterie = 12.5;

        // initialisation du robot et passage de ses caractéristiques
        this.robot2View = new RobotAspiratorModel();
        this.robot2View.robotName = "robot2";
        this.robot2View.basePosition = { x: 9, y: 0 };
        this.robot2View.lastPosition = { ...this.robot2View!.basePosition };
        this.robot2View.position = { ...this.robot2View!.basePosition };
        this.robot2View.batterie = 50;

        // init de la base de charge du robot:
        this.maisonComponent.maisonModel.maison[this.robot2View!.basePosition.y][this.robot2View!.basePosition.x].cellStack[0].type = 'B';

        this.aspiroX2 = 450;
        this.aspiroY2 = 0 + 82;
        this.moveTrigger2 = 0;
      }
      console.log(this.robot2View);

    }, 1000);
  }

  public pauseRobot(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    // TODO: tableau de robots:
    this.robotAspiratorComponents.get(0)?.pauseRobot();
    // this.robot1?.pauseRobot();
    // this.robot2?.pauseRobot();
  }

  public startRobot(): void {
    console.log(this.robot1View);
    this.robotAspiratorComponents.get(0)?.startRobot(this.maisonComponent.maisonModel.maison, this.robot1View);
    // TODO: remettre en place après créa de tableau de Robots
    // this.robotAspiratorComponents.forEach(robotAspiratorComponent => {
    //   robotAspiratorComponent.startRobot(this.maison, this.robot1);
    // });
  }

  // méthode pour récupérer la nouvelle valeur du composant Robot enfant > parent et mettre à jour la vue (Robot et Maison)
  public handleRobotUpdate(robotUpdate: RobotAspiratorModel): void {
    console.log("handleRobotUpdate");
    console.log(robotUpdate);
    this.updateRobotView(robotUpdate);
    this.maisonComponent.updateMaisonView(robotUpdate.lastPosition);
  }

  private updateRobotView(robotUpdate: RobotAspiratorModel): void {
    console.log(robotUpdate.robotName);
    console.log(robotUpdate.isRobotStarted);
    console.log(robotUpdate.lastPosition);
    console.log(robotUpdate.position);
    console.log(robotUpdate.batterie);

    const aspiroDirX = (robotUpdate.position.x - robotUpdate.lastPosition.x) === 1 ? 50 :
      (robotUpdate.position.x - robotUpdate.lastPosition.x) === -1 ? -50 : 0;
    const aspiroDirY = (robotUpdate.position.y - robotUpdate.lastPosition.y) === 1 ? 50 :
      (robotUpdate.position.y - robotUpdate.lastPosition.y) === -1 ? -50 : 0;

    // TODO: revoir pour tableau de robots:
    if (robotUpdate.robotName === "robot1") {
      this.aspiroX1 += aspiroDirX;
      // console.log(this.aspiroX);
      this.aspiroY1 += aspiroDirY;
      // console.log(this.aspiroY);

      // Update du robot de la vue:
      // console.log(robotUpdate);
      // copie par référence, ici:
      this.robot1View = robotUpdate;
      console.log(this.robot1View);
    } else if (robotUpdate.robotName === "robot2") {
      this.aspiroX2 += aspiroDirX;
      this.aspiroY2 += aspiroDirY;

      // Update du robot de la vue:
      // copie par référence, ici:
      this.robot2View = robotUpdate;
    }

    // nécessaire pour la fluidité de l'animation
    this.moveTrigger1++;
    this.moveTrigger2++;
  }
}
