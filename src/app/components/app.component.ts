import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, state, style, animate } from '@angular/animations';
import { Subscription } from "rxjs";
import { TableModule } from 'primeng/table';

import { MessageService } from '../services/message.service';

import { Position } from '../classes/position';
import { Cell } from '../classes/cell';
import { CellElement } from '../classes/cellElement';
import { MessagesComponent } from "../messages/messages.component";
import { RobotAspiratorComponent } from './robot-aspirator/robot-aspirator.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgFor, NgIf, FormsModule, TableModule, RobotAspiratorComponent, MessagesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
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
      }), { params: { x: 0, y: 0 + 32 } }), // décalage de Y de 32 pour le robot
      transition('* <=> *', [
        animate('200ms ease-in-out') // 400 = moins que l'interval au nuveau service pour anim plus régulière
      ]),
    ]),
    trigger('moveRobot2', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: 450, y: 0 + 32 } }), // décalage de Y de 32 pour le robot
      transition('* <=> *', [
        animate('200ms ease-in-out') // 400 = moins que l'interval au nuveau service pour anim plus régulière
      ]),
    ])
  ]
})
export class AppComponent implements OnDestroy, OnInit {

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

  static maison: Cell[][] = [[]];
  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  get MaisonView() {
    return AppComponent.maison;
  }

  // le robot peut être initialisé ou non
  private robot1?: RobotAspiratorComponent;
  private robot2?: RobotAspiratorComponent;

  // Position de la base de charge
  static basePosition1: Position;
  static basePosition2: Position;

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
  // ajout d'un décalage du robot au départ  Y += 32px:
  public aspiroY1: number;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger1: number;

  // Position robot 2
  public aspiroX2: number = 0;
  // ajout d'un décalage du robot au départ  Y += 32px:
  public aspiroY2: number = 0 + 32;
  // pour mettre à jour l'animation du déplacement du robot
  public moveTrigger2: number;

  constructor(private messageService: MessageService) {
    AppComponent.basePosition1 = { x: 0, y: 0 };
    AppComponent.basePosition2 = { x: 0, y: 0 };
    // valeurs par défaut pour l'initialisation du robot:
    this.lastPosition = { x: -2, y: -2 };
    this.position = { x: -1, y: -1 };
    this.batterie = -1;

    this.aspiroX1 = 0;
    this.aspiroY1 = 0 + 32;
    this.moveTrigger1 = 0;

    this.aspiroX2 = 450;
    this.aspiroY2 = 0 + 32;
    this.moveTrigger2 = 0;
  }

  ngOnInit(): void {
    this.startIntro();
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

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

  public startIntro(): void {
    // Création de la maison
    this.initMaisonConfig();
    AppComponent.creerMaison();

    setTimeout(() => {
      // instanciation du robot
      // console.log(this.robot1);
      if (!this.robot1) {
        // initialisation du robot et de ses caractéristiques
        this.lastPosition = { ...AppComponent.basePosition1 };
        this.position = { ...AppComponent.basePosition1 };
        this.batterie = 50;

        // TODO: revoir injection service:
        this.robot1 = new RobotAspiratorComponent(this.messageService);
        this.robot1.lastPosition = { ...this.lastPosition };
        this.robot1.position = { ...this.position };
        this.robot1.batterie = this.batterie;

        this.aspiroX1 = 0;
        this.aspiroY1 = 0 + 32;
        this.moveTrigger1 = 0
      }

      // console.log(this.robot2);
      if (!this.robot2) {
        // initialisation du robot et de ses caractéristiques
        this.lastPosition = { ...AppComponent.basePosition2 };
        this.position = { ...AppComponent.basePosition2 };
        this.batterie = 50;

        // TODO: revoir injection service:
        this.robot2 = new RobotAspiratorComponent(this.messageService);
        this.robot2.lastPosition = { ...this.lastPosition };
        this.robot2.position = { ...this.position };
        this.robot2.batterie = this.batterie;

        this.aspiroX2 = 450;
        this.aspiroY2 = 0 + 32;
        this.moveTrigger2 = 0;
      }
    }, 1000);
  }

  private initMaisonConfig(): void {
    this.log("*** initMaisonConfig ***");
    // Création de la maison
    AppComponent.largeurMaison = 10;
    AppComponent.hauteurMaison = 8;
    AppComponent.obstacles = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    AppComponent.basePosition1 = { x: 0, y: 0 };
    AppComponent.basePosition2 = { x: 9, y: 0 };
  }

  private static creerMaison(): void {
    // console.log("créer maison");
    for (let y = 0; y < AppComponent.hauteurMaison; y++) {
      AppComponent.maison[y] = [];
      for (let x = 0; x < AppComponent.largeurMaison; x++) {
        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        AppComponent.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }
    // Ajouter les obstacles
    AppComponent.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < AppComponent.largeurMaison && obs.y >= 0 && obs.y < AppComponent.hauteurMaison) {
        AppComponent.maison[obs.y][obs.x].cellStack[0].type = 'X';
      }
    });
    // Position de la base de charge
    AppComponent.maison[AppComponent.basePosition1.y][AppComponent.basePosition1.x].cellStack[0].type = 'B';
    // AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].cellStack[0].visited = true;

    AppComponent.maison[AppComponent.basePosition2.y][AppComponent.basePosition2.x].cellStack[0].type = 'B';

  }

  pauseRobot(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.robot1?.pauseRobot();
    this.robot2?.pauseRobot();
  }

  startRobot(): void {
    // A l'intro, pas de souscription, donc on l'initialise ici
    // si on clique plusieurs fois sur start, la souscription existe, et est ouverte, donc on ne resouscrit pas
    // si on restart après mise en pause, la souscription existe à l'état closed, on la réinitialise ici
    if (!this.subscription || this.subscription.closed) {
      this.subscription = new Subscription();
      this.addRobotToSubscription(this.robot1!, "robot1");
      this.addRobotToSubscription(this.robot2!, "robot2");
    }

  }

  private addRobotToSubscription(robot: RobotAspiratorComponent, robotName: string): void {
    this.subscription!.add(
      robot?.onStartNettoyer().subscribe({
        next: ([lastPosition, position]: Position[]) => {
          console.log('next startRobot...');
          this.log('next startRobot...');
          this.log(lastPosition.x.toString());
          this.log(lastPosition.y.toString());
          this.log(position.x.toString());
          this.log(position.y.toString());

          this.updateRobotView(robotName, lastPosition, position);

          this.updateMaisonViewWithRobot(lastPosition);

          if (position.x === AppComponent.basePosition1.x && position.y === AppComponent.basePosition1.y) {
            this.log("arrivée à la base > unsubscribe");
            this.pauseRobot();
          }
        },
        error: (err: string) => {
          this.log('Erreur onStartNettoyer: ' + err);
        },
        complete: () => {
          this.log('complete onStartNettoyer: ok !');
          // this.startIntro();
          this.subscription!.unsubscribe();
        }
      })
    );
  }

  private updateRobotView(robotName: string, lastPosition: Position, position: Position): void {

    // console.log(lastPosition);
    // console.log(position);
    // console.log(this.robot.position);
    // console.log(this.robot.position);

    const aspiroDirX = (position.x - lastPosition.x) === 1 ? 50 :
      (position.x - lastPosition.x) === -1 ? -50 : 0;
    const aspiroDirY = (position.y - lastPosition.y) === 1 ? 50 :
      (position.y - lastPosition.y) === -1 ? -50 : 0;

    if (robotName ==="robot1") {
      this.aspiroX1 += aspiroDirX;
      // console.log(this.aspiroX);
      this.aspiroY1 += aspiroDirY;
      // console.log(this.aspiroY);
      // TODO: améliorer
    } else if (robotName ==="robot2") {
      this.aspiroX2 += aspiroDirX;
      this.aspiroY2 += aspiroDirY;
    }
  }

  public updateMaisonViewWithRobot(lastPosition: Position): void {

    this.log("updateMaisonViewWithRobot");
    this.log("lastPosition.x = " + lastPosition.x);
    this.log("lastPosition.x = " + lastPosition.y);

    // on ne veut pas que la case de la base soit modifiée:
    if (AppComponent.maison[lastPosition.y][lastPosition.x].cellStack[0].type !== 'B') {
      AppComponent.maison[lastPosition.y][lastPosition.x].cellStack[0].visited = true;
      AppComponent.maison[lastPosition.y][lastPosition.x].cellStack[0].type = '_';
    }

    // nécessaire pour la fluidité de l'animation
    this.moveTrigger1++;
    this.moveTrigger2++;
  }

  // Vérifier si toutes les cellules accessibles ont été visitées
  static toutEstNettoye(): boolean {
    for (let i = 0; i < AppComponent.maison.length; i++) {
      for (let j = 0; j < AppComponent.maison[i].length; j++) {
        const cell: Cell = AppComponent.maison[i][j];
        if (cell.cellStack[0].type !== 'X' && cell.cellStack[0].type !== 'B' && !cell.cellStack[0].visited) {
          return false;
        }
      }
    }
    return true;
  }

}
