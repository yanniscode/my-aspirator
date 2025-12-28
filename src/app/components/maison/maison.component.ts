import { trigger, transition, style, animate, state } from '@angular/animations';

import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject } from '@angular/core';

import { TableModule } from "primeng/table";

import { MessageService } from '../../services/message-service/message.service';
import { MaisonModel } from '../../classes/models/maison-model';
import { RobotAspiratorComponent } from "../robot-aspirator/robot-aspirator.component";
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';

@Component({
  selector: 'app-maison',
  standalone: true,
  imports: [TableModule, RobotAspiratorComponent],
  templateUrl: './maison.component.html',
  styleUrl: './maison.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('maisonAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1500ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('moveRobot1', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: -100, y: 0 } }),
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'intervalle au niveau service pour anim plus régulière
      ]),
    ]),
    trigger('moveRobot2', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: 550, y: 0 } }),
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'intervalle au niveau service pour anim plus régulière
      ]),
    ]),
    trigger('moveRobot3', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: 500, y: 350 } }),
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'intervalle au niveau service pour anim plus régulière
      ]),
    ]),
    trigger('moveRobot4', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: -100, y: 350 } }),
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'intervalle au niveau service pour anim plus régulière
      ]),
    ])
  ]
})
export class MaisonComponent {

  private messageService = inject(MessageService);

  // variable de template binding:
  public maisonViewModel: MaisonModel;

  // *** ROBOT 1:
  // Variables pour la mise à jour de la Vue (public car appelées par le template)
  // Position robot 1
  public aspiroX1: number;
  public aspiroY1: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger1: number;

  // *** ROBOT 2:
  public aspiroX2: number;
  public aspiroY2: number;
  public moveTrigger2: number;

  // *** ROBOT 3:
  public aspiroX3: number;
  public aspiroY3: number;
  public moveTrigger3: number;

  // *** ROBOT 4:
  public aspiroX4: number;
  public aspiroY4: number;
  public moveTrigger4: number;

  constructor() {
    console.log("MaisonComponent - constructor()");

    this.maisonViewModel = new MaisonModel();
    this.maisonViewModel.largeurMaison = 10;
    this.maisonViewModel.hauteurMaison = 8;
    this.maisonViewModel.obstacles = [];
    this.maisonViewModel.isNettoyageComplete = false;

    this.aspiroX1 = 0;
    this.aspiroY1 = 0;
    this.moveTrigger1 = 0;

    this.aspiroX2 = 450;
    this.aspiroY2 = 0;
    this.moveTrigger2 = 0;

    this.aspiroX3 = 450;
    this.aspiroY3 = 350;
    this.moveTrigger3 = 0;

    this.aspiroX4 = 0;
    this.aspiroY4 = 350;
    this.moveTrigger4 = 0;
  }

  public construireMaison(maisonModel: MaisonModel): void {
    console.log("MaisonComponent - construireMaison()");

    // instanciation de la maison pour la Vue (composant MaisonComponent) :
    this.maisonViewModel = { ...maisonModel };
  }

  // TODO: pour version avec signaux: déplacer dans Main ou composant Robot ?
  public updateRobotView(robotUpdateModel: RobotAspiratorModel): void {
    console.log("MaisonComponent - updateRobotView()");

    const aspiroDirX = (robotUpdateModel.position.x - robotUpdateModel.lastPosition.x) === 1 ? 50 :
      (robotUpdateModel.position.x - robotUpdateModel.lastPosition.x) === -1 ? -50 : 0;
    const aspiroDirY = (robotUpdateModel.position.y - robotUpdateModel.lastPosition.y) === 1 ? 50 :
      (robotUpdateModel.position.y - robotUpdateModel.lastPosition.y) === -1 ? -50 : 0;

    // TODO: revoir pour tableau de robots:
    if (robotUpdateModel.robotName === "robot1") {
      this.aspiroX1 += aspiroDirX;
      // console.log(this.aspiroX);
      this.aspiroY1 += aspiroDirY;
      // console.log(this.aspiroY);
    } else if (robotUpdateModel.robotName === "robot2") {
      this.aspiroX2 += aspiroDirX;
      this.aspiroY2 += aspiroDirY;
    } else if (robotUpdateModel.robotName === "robot3") {
      this.aspiroX3 += aspiroDirX;
      this.aspiroY3 += aspiroDirY;
    } else if (robotUpdateModel.robotName === "robot4") {
      this.aspiroX4 += aspiroDirX;
      this.aspiroY4 += aspiroDirY;
    }

    // nécessaire pour la fluidité de l'animation
    this.moveTrigger1++;
    this.moveTrigger2++;
    this.moveTrigger3++;
    this.moveTrigger4++;
  }

  private log(message: string): void {
    this.messageService.add(`MaisonComponent: ${message}`);
  }
}
