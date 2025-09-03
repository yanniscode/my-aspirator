import { trigger, transition, style, animate, state } from '@angular/animations';
import { NgFor, NgIf } from '@angular/common';
import { Component, ViewEncapsulation, OnDestroy, OnInit, ViewChildren, QueryList } from '@angular/core';
import { MessageService } from '../../services/message-service/message.service';
import { TableModule } from "primeng/table";
import { MaisonModel } from '../../classes/models/maison-model';
import { Position } from '../../classes/models/position';
import { RobotAspiratorComponent } from "../robot-aspirator/robot-aspirator.component";
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { CellElement } from '../../classes/models/cellElement';

@Component({
  selector: 'app-maison',
  imports: [NgFor, NgIf, TableModule, RobotAspiratorComponent],
  templateUrl: './maison.component.html',
  styleUrl: './maison.component.css',
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
      }), { params: { x: 0, y: 0 + 82 } }), // décalage de Y de 32 pour le robot
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'intervalle au niveau service pour anim plus régulière
      ]),
    ]),
    trigger('moveRobot2', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: 450, y: 0 + 82 } }), // décalage de Y de 32 pour le robot
      transition('* <=> *', [
        animate('300ms ease-in-out') // 400 = moins que l'intervalle au niveau service pour anim plus régulière
      ]),
    ])
  ]
})
export class MaisonComponent implements OnDestroy, OnInit {
  @ViewChildren(RobotAspiratorComponent) robotAspiratorChildComponents!: QueryList<RobotAspiratorComponent>;

  public maisonViewModel: MaisonModel;

  // *** ROBOT 1:
  // Variables pour la mise à jour de la Vue (public car appelées par le template)
  // Position robot 1
  public aspiroX1: number;
  // ajout d'un décalage du robot au départ  Y += 82:
  public aspiroY1: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger1: number;

  // *** ROBOT 2:

  // Position robot 2
  public aspiroX2: number;
  // ajout d'un décalage du robot au départ  Y += 82px:
  public aspiroY2: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger2: number;

  private robotModelsTab: RobotAspiratorModel[];

  // TODO: supprimer si non nécessaire
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

  ngOnDestroy(): void {
    console.log("MaisonComponent ngOnDestroy()");

    // TODO: gérer destruction du composant enfant + service ?
    // Se désabonner pour éviter les fuites de mémoire
    for (let robotIndex in this.robotModelsTab) {
      const robotSubscription = this?.robotAspiratorChildComponents?.get(Number(robotIndex))?.subscription;
      // Note: on vérifie null et undefined avec "!="
      if (robotSubscription != null) {
        robotSubscription.unsubscribe();
      }
    }
  }

  ngOnInit(): void {
    console.log("MaisonComponent ngOnInit()");
    console.log('Nombre de robots:', this.robotAspiratorChildComponents?.length);
  }

  constructor(private messageService: MessageService) {
    console.log("MaisonComponent constructor()");

    this.maisonViewModel = new MaisonModel();
    this.maisonViewModel.largeurMaison = 10;
    this.maisonViewModel.hauteurMaison = 8;
    this.maisonViewModel.obstacles = [];
    this.maisonViewModel.isNettoyageComplete = false;

    this.robotModelsTab = [];
    this.aspiroX1 = 0;
    this.aspiroY1 = 0 + 82;
    this.moveTrigger1 = 0;

    this.aspiroX2 = 450;
    this.aspiroY2 = 0 + 82;
    this.moveTrigger2 = 0;
  }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

  public construireMaison(maisonModel: MaisonModel): void {
    // instanciation de la maisonpour la Vue (composant maison) :
    this.maisonViewModel = { ...maisonModel };
  }

  public maisonPause(robotModelsTab: RobotAspiratorModel[]) {
    console.log("MaisonComponent maisonPause()");
    if (this.robotAspiratorChildComponents.length) {
      for (let robotIndex in robotModelsTab) {
        this.robotAspiratorChildComponents.get(Number(robotIndex))?.robotPause();
      }
    }
  }

  public onMaisonStart(maisonModel: MaisonModel, robotModelsTab: RobotAspiratorModel[]) {
    console.log("MaisonComponent onMaisonStart()");
    console.log("robotModelsTab");
    console.log(robotModelsTab[0]);
    console.log(robotModelsTab[0].lastPosition);
    console.log(robotModelsTab[0].position);
    console.log(robotModelsTab[0].batterie);
    console.log(robotModelsTab[0].isRobotStarted);
    console.log(robotModelsTab[0].isRobotReturningToBase);

    for (let robotIndex in robotModelsTab) {
      console.log("loop number=" + robotIndex);
      const robotModel = robotModelsTab[Number(robotIndex)];

      // Le robot démarre
      robotModel.isRobotStarted = true;

      this.robotAspiratorChildComponents.get(Number(robotIndex))?.startRobot(maisonModel, robotModel);
    }
  }

  // méthode pour récupérer la nouvelle valeur du Robot depuis le composant enfant et mettre à jour la vue (Robot et Maison)
  public handleRobotUpdate(robotUpdateModel: RobotAspiratorModel): void {
    console.log("MaisonComponent handleRobotUpdate()");
    // console.log(robotUpdateModel);
    if(robotUpdateModel.batterie > 0) {
      this.updateRobotView(robotUpdateModel);
      this.updateMaisonView(robotUpdateModel.lastPosition);
    }
  }

  public updateMaisonView(lastPosition: Position): void {
    console.log("MaisonComponent updateMaisonView()");
    console.log("lastPosition.x = " + lastPosition.x);
    console.log("lastPosition.y = " + lastPosition.y);

    // Vérification des null et undefined
    if (lastPosition.x == null || lastPosition.y == null) {
      return;
    }
    // on ne veut pas que la case de la base soit modifiée:
    const lastVisitedCell: CellElement = this.maisonViewModel.maison[lastPosition.y][lastPosition.x].cellStack[0];

    if (lastVisitedCell.type !== 'B') {
      lastVisitedCell.visited = true;
      lastVisitedCell.type = '_';
    }
  }

  private updateRobotView(robotUpdateModel: RobotAspiratorModel): void {
    console.log("MaisonComponent updateRobotView()");;
    console.log(robotUpdateModel.robotName);
    console.log(robotUpdateModel.isRobotStarted);
    console.log(robotUpdateModel.lastPosition);
    console.log(robotUpdateModel.position);
    console.log(robotUpdateModel.batterie);

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
    }

    // nécessaire pour la fluidité de l'animation
    this.moveTrigger1++;
    this.moveTrigger2++;
  }
}
