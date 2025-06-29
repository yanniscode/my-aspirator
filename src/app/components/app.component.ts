import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, state, style, animate } from '@angular/animations';
import { Observable, Subscription } from "rxjs";
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
export class AppComponent {
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

  // pour mettre à jour l'animation du déplacement du robot
  moveTrigger: number = 0;

  // Position
  aspiroX: number = 0;
  // ajout d'un décalage du robot au départ  Y += 32px:
  aspiroY: number = 0 + 32;

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription !: Subscription;
  private updateSubscriptionNettoyer!: Subscription;
  private updateSubscriptionRetourABase!: Subscription;
  private updateDrawEverything!: Subscription;

  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  static maison: Cell[][] = [[]];
  get MaisonView() {
    return AppComponent.maison;
  }
  static basePosition: Position = { x: 0, y: 0 };
  static messageService: MessageService;

  constructor(messageService: MessageService) {
    AppComponent.messageService = messageService;

    AppComponent.initMaisonConfig();

    RobotAspiratorComponent.robot = new RobotAspiratorComponent(this);
    RobotAspiratorComponent.robotAtLastPosition = new RobotAspiratorComponent(this);
  }


  ngOnInit(): void {
    console.log("ngOnInit");
    const newPosition: Position = RobotAspiratorComponent.robot.updateAspiroDirection();
    this.aspiroX = newPosition.x;
    this.aspiroY = newPosition.y;
    this.moveTrigger++;

    this.startIntro();
  }

  ngOnDestroy(): void {
    // réinitialisation du déplacement du robot
    this.moveTrigger = 0;

    // Se désabonner pour éviter les fuites de mémoire
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.updateSubscriptionNettoyer) {
      this.updateSubscriptionNettoyer.unsubscribe();
    }
    if (this.updateSubscriptionRetourABase) {
      this.updateSubscriptionRetourABase.unsubscribe();
    }
    if (this.updateDrawEverything) {
      this.updateDrawEverything.unsubscribe();
    }
  }

  static initMaisonConfig(): void {
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
    AppComponent.creerMaison();
  }

  static creerMaison(): void {
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

  private startIntro(): void {
    // Création de la maison
    AppComponent.initMaisonConfig();

    // Créer et démarrer le robot
    // rafraîchissement de l'affichage de la maison avec le robot à sa nouvelle position
    RobotAspiratorComponent.robot = new RobotAspiratorComponent(this);
    RobotAspiratorComponent.robotAtLastPosition = new RobotAspiratorComponent(this);

    setTimeout(() => {
      // remplace un élément du tableau par le robot et l'affiche
      this.updateMaisonWithRobot();
    }, 1000);
  }

  startRobot(): void {
    if (RobotAspiratorComponent.isRobotStarted === true) {
      return;
    }

    // si l'on préfère afficher le robot seulement après clic sur start:
    AppComponent.log("Début du nettoyage");
    RobotAspiratorComponent.isRobotStarted = true;
    // algo principal de nettoyage de la maison
    this.updateSubscriptionNettoyer = RobotAspiratorComponent.robot.nettoyer().subscribe({
      next: () => {
        AppComponent.log('next nettoyer...');
      },
      error: (err) => {
        AppComponent.log('Erreur nettoyer: ' + err);
      },
      complete: () => {
        AppComponent.log('complete nettoyer: Nettoyage ok !');
        // Retourner à la base de charge
        AppComponent.log(`Batterie: ${RobotAspiratorComponent.robot.batterie}%. Retour à la base.`);

        // puis on souscrit à retournerALaBase
        this.updateSubscriptionRetourABase = RobotAspiratorComponent.robot.retournerALaBase().subscribe({
          next: (robot) => {
            AppComponent.log('next retournerALaBase...');
            AppComponent.log(RobotAspiratorComponent.robotAtLastPosition.position.x.toString());
            AppComponent.log(RobotAspiratorComponent.robotAtLastPosition.position.y.toString());
            AppComponent.log(robot.position.x.toString());
            AppComponent.log(robot.position.y.toString());
          },
          error: (err) => {
            AppComponent.log('Erreur retournerALaBase: ' + err);
          },
          complete: () => {
            AppComponent.log('complete retournerALaBase: ok !');
            RobotAspiratorComponent.isRobotStarted = false;
            this.startIntro();
          }
        });
      }
    });
  }

  pauseRobot(): void {
    if (this.updateSubscriptionNettoyer) {
      this.updateSubscriptionNettoyer.unsubscribe();
      RobotAspiratorComponent.isRobotStarted = false;
    }
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

  public updateMaisonWithRobot(): void {
    console.log("updateMaisonWithRobot");
    const newPosition: Position = RobotAspiratorComponent.robot.updateAspiroDirection();
    this.aspiroX = newPosition.x;
    this.aspiroY = newPosition.y;
    this.moveTrigger++;
  }

  static log(message: string) {
    AppComponent.messageService.add(`AppComponent: ${message}`);
  }
}
