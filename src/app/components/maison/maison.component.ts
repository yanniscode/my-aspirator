import { trigger, transition, style, animate, state } from '@angular/animations';
import { NgFor, NgIf } from '@angular/common';
import { Component, ViewEncapsulation, OnDestroy, OnInit, ViewChildren, QueryList } from '@angular/core';
import { MessageService } from '../../services/message.service';
import { TableModule } from "primeng/table";
import { CellElement } from '../../classes/models/cellElement';
import { MaisonModel } from '../../classes/models/maison-model';
import { Position } from '../../classes/models/position';
import { RobotAspiratorComponent } from "../robot-aspirator/robot-aspirator.component";
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { Subscription } from 'rxjs/internal/Subscription';

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
export class MaisonComponent implements OnDestroy, OnInit {
  @ViewChildren(RobotAspiratorComponent) robotAspiratorChildComponents!: QueryList<RobotAspiratorComponent>;

  private robotChildSubscription!: Subscription;

  public maisonModel: MaisonModel;

  // *** ROBOT 1:
  // le robot peut être initialisé ou non
  private robot1Model: RobotAspiratorModel;

  // Variables pour la mise à jour de la Vue (public car appelées par le template)
  // Position robot 1
  public aspiroX1: number;
  // ajout d'un décalage du robot au départ  Y += 82:
  public aspiroY1: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger1: number;

  // méthode pour l'envoi au composant enfant RobotAspiratorComponent
  public currentRobot1Parameters() {
    return this.robot1Model;
  }

  // *** ROBOT 2:
  private robot2Model: RobotAspiratorModel;

  // Position robot 2
  public aspiroX2: number;
  // ajout d'un décalage du robot au départ  Y += 82px:
  public aspiroY2: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger2: number;

  // méthode pour l'envoi au composant enfant RobotAspiratorComponent
  public currentRobot2Parameters() {
    return this.robot2Model;
  }

  private robotModelsTab: RobotAspiratorModel[];

  ngOnDestroy(): void {
    console.log("MaisonComponent ngOnDestroy()");
    // TODO: gérer destruction du composant enfant + service ?
    // Se désabonner pour éviter les fuites de mémoire
    const robot1Subscription = this.robotAspiratorChildComponents.get(0)?.subscription;
    const robot2Subscription = this.robotAspiratorChildComponents.get(1)?.subscription;

    if (this.robotChildSubscription) {
      robot1Subscription?.unsubscribe();
      robot2Subscription?.unsubscribe();
    }
  }

  ngOnInit(): void {
    console.log("MaisonComponent ngOnInit()");
    console.log('Nombre de robots:', this.robotAspiratorChildComponents?.length);

    // Attendre que la vue soit complètement initialisée
    setTimeout(() => {
      if (this.robotAspiratorChildComponents) {
        this.startIntro();
      }
    }, 100);
  }

  constructor(private messageService: MessageService) {
    console.log("MaisonComponent constructor()");

    this.maisonModel = new MaisonModel();
    this.maisonModel.largeurMaison = 10;
    this.maisonModel.hauteurMaison = 8;
    this.maisonModel.obstacles = [];
    this.maisonModel.isNettoyageComplete = false;

    // initialisation des robots:
    this.robot1Model = new RobotAspiratorModel();
    this.robot2Model = new RobotAspiratorModel();
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

  private initMaisonConfig(): void {
    console.log("MaisonComponent initMaisonConfig()");
    // Création de la maison
    this.maisonModel.largeurMaison = 10;
    this.maisonModel.hauteurMaison = 8;
    this.maisonModel.obstacles = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    this.maisonModel.isNettoyageComplete = false;
  }

  public creerMaison(): void {
    console.log("MaisonComponent creerMaison()");
    for (let y = 0; y < this.maisonModel.hauteurMaison; y++) {
      this.maisonModel.maison[y] = [];
      for (let x = 0; x < this.maisonModel.largeurMaison; x++) {
        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        this.maisonModel.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }
    // Ajouter les obstacles
    this.maisonModel.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < this.maisonModel.largeurMaison && obs.y >= 0 && obs.y < this.maisonModel.hauteurMaison) {
        this.maisonModel.maison[obs.y][obs.x].cellStack[0].type = 'X';
      }
    });
  }

  public startIntro(): void {
    console.log("MaisonComponent startIntro()");

    this.initMaisonConfig();
    this.creerMaison();
    this.initRobots();
  }

  private initRobots(): void {

    setTimeout(() => {
      console.log("MaisonComponent this.robot1 :");
      console.log(this.robot1Model);

      // TODO: revoir condition
      if (this.robot1Model.isRobotStarted === false) {
        console.log(this.robot1Model.isRobotStarted === false);

        // initialisation du robot et passage de ses caractéristiques
        this.robot1Model = new RobotAspiratorModel();
        this.robot1Model.robotName = "robot1";
        this.robot1Model.basePosition = { x: 0, y: 0 };
        // au départ, le robot est à la base:
        this.robot1Model.lastPosition = { ...this.robot1Model.basePosition };
        this.robot1Model.position = { ...this.robot1Model.basePosition };
        this.robot1Model.batterie = 5.5;
        this.robot1Model.isRobotStarted = false;

        // init de la base de charge du robot:
        // TODO: revoir inversion x, y:
        this.maisonModel.maison[this.robot1Model.basePosition.y][this.robot1Model.basePosition.x].cellStack[0].type = 'B';

        this.aspiroX1 = 0;
        this.aspiroY1 = 0 + 82;
        this.moveTrigger1 = 0

        console.log(this.robot1Model);
      }

      // console.log(this.robot2);
      if (this.robot2Model.isRobotStarted === false) {
        // initialisation du robot et passage de ses caractéristiques
        this.robot2Model = new RobotAspiratorModel();
        this.robot2Model.robotName = "robot2";
        this.robot2Model.basePosition = { x: 9, y: 0 };
        this.robot2Model.lastPosition = { ...this.robot2Model!.basePosition };
        this.robot2Model.position = { ...this.robot2Model!.basePosition };
        this.robot2Model.batterie = 50;
        this.robot2Model.isRobotStarted = false;

        // init de la base de charge du robot:
        this.maisonModel.maison[this.robot2Model!.basePosition.y][this.robot2Model!.basePosition.x].cellStack[0].type = 'B';

        this.aspiroX2 = 450;
        this.aspiroY2 = 0 + 82;
        this.moveTrigger2 = 0;

        console.log(this.robot2Model);
      }
      // les robots sont ajoutés au tableau
      this.robotModelsTab = [this.robot1Model, this.robot2Model];
    }, 1000);


  }

  public onPause() {
    console.log("MaisonComponent onPause()");;

    if (this.robotAspiratorChildComponents.length) {
      for (var robotIndex in this.robotModelsTab) {
        this.robotAspiratorChildComponents.get(Number(robotIndex))?.pauseRobot();
      }
    }
  }

  public onStart() {
    console.log("MaisonComponent onStart()");
    console.log("this.robot1Model");
    console.log(this.robot1Model);
    console.log(this.robot1Model.lastPosition);
    console.log(this.robot1Model.position);

    this.robot1Model.isRobotStarted = true;
    this.robot2Model.isRobotStarted = true;

    for (var robotIndex in this.robotModelsTab) {
      console.log("loop number="+ robotIndex);
      this.robotAspiratorChildComponents.get(Number(robotIndex))?.startRobot(this.maisonModel, this.robotModelsTab[Number(robotIndex)]);
    }
  }

  // méthode pour récupérer la nouvelle valeur du Robot depuis le composant enfant et mettre à jour la vue (Robot et Maison)
  public handleRobotUpdate(robotUpdateModel: RobotAspiratorModel): void {
    console.log("MaisonComponent handleRobotUpdate()");
    // console.log(robotUpdateModel);
    this.updateRobotView(robotUpdateModel);
    this.updateMaisonView(robotUpdateModel.lastPosition);
  }

  public updateMaisonView(lastPosition: Position): void {
    console.log("MaisonComponent updateMaisonView()");
    console.log("lastPosition.x = " + lastPosition.x);
    console.log("lastPosition.x = " + lastPosition.y);

    // on ne veut pas que la case de la base soit modifiée:
    if (this.maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0].type !== 'B') {
      this.maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0].visited = true;
      this.maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0].type = '_';
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

      // Update du robot de la vue:
      console.log(robotUpdateModel);
      // copie par référence, ici:
      this.robot1Model = robotUpdateModel;
      console.log(this.robot1Model);
    } else if (robotUpdateModel.robotName === "robot2") {
      this.aspiroX2 += aspiroDirX;
      this.aspiroY2 += aspiroDirY;

      // Update du robot de la vue:
      // copie par référence, ici:
      this.robot2Model = robotUpdateModel;
    }

    // nécessaire pour la fluidité de l'animation
    this.moveTrigger1++;
    this.moveTrigger2++;
  }
}
