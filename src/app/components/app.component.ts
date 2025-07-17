import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, state, style, animate } from '@angular/animations';
import { Subscription, timer } from "rxjs";
import { TableModule } from 'primeng/table';

import { MessageService } from '../services/message.service';

import { Position } from '../classes/position';
import { Cell } from '../classes/cell';
import { CellElement } from '../classes/cellElement';
import { MessagesComponent } from "../messages/messages.component";
import { RobotAspiratorComponent } from './robot-aspirator/robot-aspirator.component';
import { RobotAspiratorService } from '../services/robot-actions/robot-aspirator.service';

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
    trigger('moveRobot', [
      state('*', style({
        transform: 'translate({{ x }}px, {{ y }}px)'
      }), { params: { x: 0, y: 0 + 32 } }), // décalage de Y de 32 pour le robot
      transition('* <=> *', [
        animate('500ms ease-in-out')
      ])
    ])
  ]
})
export class AppComponent implements OnDestroy, OnInit {
  title = 'my-aspirator-robot';

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

  // TODO: revoir
  private subscription = new Subscription();

  static messageService: MessageService;

  robotAspiratorService: RobotAspiratorService;

  static maison: Cell[][] = [[]];
  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  get MaisonView() {
    return AppComponent.maison;
  }
  static basePosition: Position = { x: 0, y: 0 };

  robot: RobotAspiratorComponent;
  // Position
  aspiroX: number = 0;
  // ajout d'un décalage du robot au départ  Y += 32px:
  aspiroY: number = 0 + 32;
  // pour mettre à jour l'animation du déplacement du robot
  moveTrigger: number = 0;

  constructor(messageService: MessageService) {
    AppComponent.messageService = messageService;
    this.robotAspiratorService = new RobotAspiratorService(this);

    // nécessaire instantiation du robot:
    this.robot = new RobotAspiratorComponent(this);
  }

  ngOnInit(): void {
    // TODO: revoir
    // S'abonner aux mises à jour pour mettre à jour la vue
    this.subscription.add(
      this.robotAspiratorService.robotPosition$.subscribe(result => {
        const [lastPos, currentPos] = result.positions;
        console.log('From:', lastPos);
        console.log('To:', currentPos);
        this.updateMaisonViewWithRobot(lastPos, currentPos);
      })
    );

    this.startIntro();
  }

  ngOnDestroy(): void {
    // réinitialisation du déplacement du robot
    this.moveTrigger = 0;

    // Se désabonner pour éviter les fuites de mémoire
    this.subscription.unsubscribe();
  }

  public startIntro(): void {
    // TODO: réinit de la position du robot après un second tour: à tester
    // this.robot.position = { ...AppComponent.basePosition };
    // ou réinit du robot si besoin:
    // this.robot = new RobotAspiratorComponent(this);

    // Création de la maison
    AppComponent.initMaisonConfig();
    AppComponent.creerMaison();

    setTimeout(() => {
      this.robot = new RobotAspiratorComponent(this);
      // // S'abonner aux mises à jour pour mettre à jour la vue
      // this.subscription.add(
      //   this.robot.robotAspiratorService.robotPosition$.subscribe(update => {
      //     this.updateMaisonViewWithRobot(update.last, update.current);
      //   })
      // );

      // remplace un élément du tableau par le robot et l'affiche
      // this.updateMaisonViewWithRobot(this.robot.position, this.robot.lastPosition);
    }, 1000);
  }

  private static initMaisonConfig(): void {
    AppComponent.log("initMaisonConfig");
    // Création de la maison
    AppComponent.largeurMaison = 10;
    AppComponent.hauteurMaison = 8;
    AppComponent.obstacles = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    AppComponent.basePosition = { x: 0, y: 0 };
  }

  private static creerMaison(): void {
    console.log("créer maison");
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
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].cellStack[0].type = 'B';
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].cellStack[0].visited = true;
  }

  pauseRobot(): void {
    this.robot.pauseRobot();
  }

  startRobot(): void {
    this.subscription.add(
      this.robot.onStartNettoyer().subscribe({
      // this.updateSubscriptionOnStartNettoyer = this.robot.onStartNettoyer().subscribe({
        next: ([lastPosition, position]: Position[]) => {
          console.log('next startRobot...');
          console.log(lastPosition.x.toString());
          console.log(lastPosition.y.toString());
          console.log(position.x.toString());
          console.log(position.y.toString());
          this.updateMaisonViewWithRobot(lastPosition, position);
        },
        error: (err: string) => {
          AppComponent.log('Erreur onStartNettoyer: ' + err);
        },
        complete: () => {
          AppComponent.log('complete onStartNettoyer: ok !');
        }
      })
    );
  }

  public updateMaisonViewWithRobot(lastPosition: Position, position: Position): void {

    this.updateRobotView(lastPosition, position);

    // // TODO: bug vue (robot décallé de sa position)
    const delayed$ = timer(500);
    delayed$.subscribe(() => {
      // console.log("position.x = "+ position.x);
      // console.log("position.y = "+ position.y);
      AppComponent.maison[position.y][position.x].cellStack[0].visited = true;
      AppComponent.maison[position.y][position.x].cellStack[0].type = '_';
    });

    // nécessaire pour la fluidité de l'animation
    this.moveTrigger++;
    console.log(this.moveTrigger);
  }

  // TODO: a revoir: nécessaire retour de données ?
  private updateRobotView(lastPosition: Position, position: Position): void {

    // console.log(lastPosition);
    // console.log(position);
    // console.log(this.robot.position);
    // console.log(this.robot.position);

    // TODO: instantiation à revoir car pas utilisée?
    this.robot.lastPosition = lastPosition;
    this.robot.position = position;

    const aspiroDirX = (position.x - lastPosition.x) === 1 ? 50 :
      (position.x - lastPosition.x) === -1 ? -50 : 0;
    const aspiroDirY = (position.y - lastPosition.y) === 1 ? 50 :
      (position.y - lastPosition.y) === -1 ? -50 : 0;

    this.aspiroX += aspiroDirX;
    // console.log(this.aspiroX);
    this.aspiroY += aspiroDirY;
    // console.log(this.aspiroY);
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

  static log(message: string) {
    AppComponent.messageService.add(`AppComponent: ${message}`);
  }
}
