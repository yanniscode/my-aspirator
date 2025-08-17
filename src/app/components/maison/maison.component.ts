import { trigger, transition, style, animate, state } from '@angular/animations';
import { NgFor, NgIf } from '@angular/common';
import { Component, ViewEncapsulation, OnDestroy, OnInit, ViewChildren, QueryList } from '@angular/core';
import { MessageService } from '../../services/message.service';
import { TableModule } from "primeng/table";
import { CellElement } from '../../classes/models/cellElement';
import { Maison } from '../../classes/models/maison';
import { Position } from '../../classes/models/position';
import { RobotAspiratorComponent } from "../robot-aspirator/robot-aspirator.component";
import { RobotAspirator } from '../../classes/models/robot-aspirator';
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

  public maisonView: Maison;

  // *** ROBOT 1:
  // le robot peut être initialisé ou non
  private robot1View: RobotAspirator;

  // Variables pour la mise à jour de la Vue (public car appelées par le template)
  // Position robot 1
  public aspiroX1: number;
  // ajout d'un décalage du robot au départ  Y += 82:
  public aspiroY1: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger1: number;

  // méthode pour l'envoi au composant enfant RobotAspiratorComponent
  public currentRobot1Parameters() {
    return this.robot1View;
  }

  // *** ROBOT 2:
  private robot2View: RobotAspirator;

  // Position robot 2
  public aspiroX2: number = 0;
  // ajout d'un décalage du robot au départ  Y += 82px:
  public aspiroY2: number = 0 + 82;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger2: number;

  // méthode pour l'envoi au composant enfant RobotAspiratorComponent
  public currentRobot2Parameters() {
    return this.robot2View;
  }

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

    this.maisonView = new Maison();
    // TODO: revoir maison sans static ??
    this.maisonView.largeurMaison = 10;
    this.maisonView.hauteurMaison = 8;
    this.maisonView.obstacles = [];
    this.maisonView.isNettoyageComplete = false;

    // initialisation des robots:
    this.robot1View = new RobotAspirator();
    this.robot2View = new RobotAspirator();
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
    this.maisonView.largeurMaison = 10;
    this.maisonView.hauteurMaison = 8;
    this.maisonView.obstacles = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    this.maisonView.isNettoyageComplete = false;
  }

  // TODO: classe maison:
  public creerMaison(): void {
    console.log("MaisonComponent creerMaison()");
    for (let y = 0; y < this.maisonView.hauteurMaison; y++) {
      this.maisonView.maison[y] = [];
      for (let x = 0; x < this.maisonView.largeurMaison; x++) {
        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        this.maisonView.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }
    // Ajouter les obstacles
    this.maisonView.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < this.maisonView.largeurMaison && obs.y >= 0 && obs.y < this.maisonView.hauteurMaison) {
        this.maisonView.maison[obs.y][obs.x].cellStack[0].type = 'X';
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
      console.log(this.robot1View);

      // TODO: revoir condition
      if (this.robot1View.isRobotStarted === false) {
        console.log(this.robot1View.isRobotStarted === false);

        // initialisation du robot et passage de ses caractéristiques
        this.robot1View = new RobotAspirator();
        this.robot1View.robotName = "robot1";
        this.robot1View.basePosition = { x: 0, y: 0 };
        // au départ, le robot est à la base:
        this.robot1View.lastPosition = { ...this.robot1View.basePosition };
        this.robot1View.position = { ...this.robot1View.basePosition };
        this.robot1View.batterie = 50;
        this.robot1View.isRobotStarted = false;

        // init de la base de charge du robot:
        // TODO: revoir inversion x, y:
        this.maisonView.maison[this.robot1View.basePosition.y][this.robot1View.basePosition.x].cellStack[0].type = 'B';

        this.aspiroX1 = 0;
        this.aspiroY1 = 0 + 82;
        this.moveTrigger1 = 0

        console.log(this.robot1View);
      }

      // console.log(this.robot2);
      if (this.robot2View.isRobotStarted === false) {
        // initialisation du robot et passage de ses caractéristiques
        this.robot2View = new RobotAspirator();
        this.robot2View.robotName = "robot2";
        this.robot2View.basePosition = { x: 9, y: 0 };
        this.robot2View.lastPosition = { ...this.robot2View!.basePosition };
        this.robot2View.position = { ...this.robot2View!.basePosition };
        this.robot2View.batterie = 50;
        this.robot2View.isRobotStarted = false;

        // init de la base de charge du robot:
        this.maisonView.maison[this.robot2View!.basePosition.y][this.robot2View!.basePosition.x].cellStack[0].type = 'B';

        this.aspiroX2 = 450;
        this.aspiroY2 = 0 + 82;
        this.moveTrigger2 = 0;

        console.log(this.robot2View);
      }
    }, 1000);
  }

  public onPause() {
    console.log("MaisonComponent onPause()");;

    if (this.robotAspiratorChildComponents.length) {
      this.robotAspiratorChildComponents.get(0)?.pauseRobot();
      this.robotAspiratorChildComponents.get(1)?.pauseRobot();
    }
  }

  public onStart() {

    console.log("MaisonComponent onStart()");
    console.log("this.robot1View");
    console.log(this.robot1View);
    console.log(this.robot1View.lastPosition);
    console.log(this.robot1View.position);

    this.robot1View.isRobotStarted = true;
    this.robot2View.isRobotStarted = true;

    // TODO: pb anim des 2 robots > ?? pb des 2 subscribes dans robotAspiratorChildComponents > startRobot()
    this.robotAspiratorChildComponents.get(0)?.startRobot(this.maisonView, this.robot1View);
    this.robotAspiratorChildComponents.get(1)?.startRobot(this.maisonView, this.robot2View);
  }

  // méthode pour récupérer la nouvelle valeur du composant Robot enfant > parent et mettre à jour la vue (Robot et Maison)
  public handleRobotUpdate(robotUpdate: RobotAspirator): void {
    console.log("MaisonComponent handleRobotUpdate()");
    console.log(robotUpdate);
    this.updateRobotView(robotUpdate);
    this.updateMaisonView(robotUpdate.lastPosition);
  }

  public updateMaisonView(lastPosition: Position): void {
    console.log("MaisonComponent updateMaisonView()");
    console.log("lastPosition.x = " + lastPosition.x);
    console.log("lastPosition.x = " + lastPosition.y);

    // on ne veut pas que la case de la base soit modifiée:
    if (this.maisonView.maison[lastPosition.y][lastPosition.x].cellStack[0].type !== 'B') {
      this.maisonView.maison[lastPosition.y][lastPosition.x].cellStack[0].visited = true;
      this.maisonView.maison[lastPosition.y][lastPosition.x].cellStack[0].type = '_';
    }
  }

  private updateRobotView(robotUpdate: RobotAspirator): void {
    console.log("MaisonComponent updateRobotView()");;
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
      console.log(robotUpdate);
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
