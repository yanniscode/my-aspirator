import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from "rxjs";
import { TableModule } from 'primeng/table';

import { MessageService } from './services/message.service';
import { MessagesComponent } from "./messages/messages.component";

import { Position } from './classes/position';
import { RobotAspirator } from './classes/robotaspirator';
import { Cell } from './classes/cell';

@Component({
  selector: 'app-root',
  imports: [NgFor, NgIf, FormsModule, MessagesComponent, TableModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('maisonAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1500ms ease-out', style({ opacity: 1 }))
      ]),
      // transition(':leave', [
      //   animate('1000ms ease-out', style({ opacity: 0 }))
      // ])
    ])
  ]
})
export class AppComponent {
  title = 'my-aspirator-robot';

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private updateSubscriptionNettoyer!: Subscription;
  private updateSubscriptionRetourABase!: Subscription;

  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  static maison: Cell[][] = [[]];
  get MaisonView() {
    return AppComponent.maison;
  }
  static basePosition: Position = { x: 0, y: 0 };
  static robot: RobotAspirator;
  static robotAtLastPosition: RobotAspirator;
  static messageService: MessageService;

  constructor(messageService: MessageService) {
    AppComponent.messageService = messageService;

    AppComponent.initMaisonConfig();

    AppComponent.robot = new RobotAspirator();
    // copie de la maison initiale (clone profond par valeur)
    AppComponent.robotAtLastPosition = structuredClone(AppComponent.robot);
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
    for (let y = 0; y < AppComponent.hauteurMaison; y++) {
      AppComponent.maison[y] = [];
      for (let x = 0; x < AppComponent.largeurMaison; x++) {
        AppComponent.maison[y][x] = {
          position: { x, y },
          type: 'O',
          visited: false
        };
      }
    }
    // Ajouter les obstacles
    AppComponent.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < AppComponent.largeurMaison && obs.y >= 0 && obs.y < AppComponent.hauteurMaison) {
        AppComponent.maison[obs.y][obs.x].type = 'X';
      }
    });
    // Position de la base de charge
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].type = 'B';
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].visited = true;
  }

  ngOnInit(): void {
    AppComponent.startIntro();
  }

  ngOnDestroy(): void {
    // Se désabonner pour éviter les fuites de mémoire
    if (this.updateSubscriptionNettoyer) {
      this.updateSubscriptionNettoyer.unsubscribe();
    }
    if (this.updateSubscriptionRetourABase) {
      this.updateSubscriptionRetourABase.unsubscribe();
    }
  }

  static startIntro(): void {
    // Création de la maison
    AppComponent.initMaisonConfig();

    // Créer et démarrer le robot
    // rafraîchissement de l'affichage de la maison avec le robot à sa nouvelle position
    AppComponent.robot = new RobotAspirator();
    AppComponent.robotAtLastPosition = structuredClone(AppComponent.robot);

    setTimeout(() => {
      // remplace un élément du tableau par le robot et l'affiche
      AppComponent.updateMaisonWithRobot();
    }, 1000);
  }

  startRobot(): void {
    AppComponent.log("Début du nettoyage");
    // algo principal de nettoyage de la maison
    this.updateSubscriptionNettoyer = AppComponent.robot.nettoyer().subscribe({
      next: () => {
        AppComponent.log('next nettoyer...');
      },
      error: (err) => {
        AppComponent.log('Erreur nettoyer: ' + err);
      },
      complete: () => {
        AppComponent.log('complete nettoyer: Nettoyage ok !');
        // Retourner à la base de charge
        AppComponent.log(`Batterie: ${AppComponent.robot.batterie}%. Retour à la base.`);
        // on ne souscrit plus à nettoyer()
        this.updateSubscriptionNettoyer.unsubscribe();
        // puis on souscrit à retournerALaBase
        this.updateSubscriptionRetourABase = AppComponent.robot.retournerALaBase(AppComponent.robot).subscribe({
          next: (robot) => {
            AppComponent.log('next retournerALaBase...');
            AppComponent.log(AppComponent.robotAtLastPosition.position.x.toString());
            AppComponent.log(AppComponent.robotAtLastPosition.position.y.toString());
            AppComponent.log(robot.position.x.toString());
            AppComponent.log(robot.position.y.toString());
          },
          error: (err) => {
            AppComponent.log('Erreur retournerALaBase: ' + err);
          },
          complete: () => {
            AppComponent.log('complete retournerALaBase: ok !');
            this.updateSubscriptionRetourABase.unsubscribe();
            AppComponent.startIntro();
          }
        });
      }
    });
  }

  pauseRobot(): void {
    if (this.updateSubscriptionNettoyer) {
      this.updateSubscriptionNettoyer.unsubscribe();
    }
  }

  // Vérifier si toutes les cellules accessibles ont été visitées
  static toutEstNettoye(): boolean {
    for (let i = 0; i < AppComponent.maison.length; i++) {
      for (let j = 0; j < AppComponent.maison[i].length; j++) {
        const cell = AppComponent.maison[i][j];
        if (cell.type !== 'X' && cell.type !== 'B' && !cell.visited) {
          return false;
        }
      }
    }
    return true;
  }

  static updateMaisonWithRobot(): void {
    // l'ancienne position du robot devient la BASE, ou bien un bloc VISITE,
    if (AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].type === 'N') {
      // si le robot quitte la base, la base est de nouveau affichée:
      AppComponent.maison[AppComponent.robotAtLastPosition.position.y][AppComponent.robotAtLastPosition.position.x].type = 'B';
    } else if (
      // si le robot quitte une position autre que la base et que tout n'est pas nettoyé, la position devient "visitée"
      AppComponent.maison[AppComponent.robotAtLastPosition.position.y][AppComponent.robotAtLastPosition.position.x].type !== 'B') {
      AppComponent.maison[AppComponent.robotAtLastPosition.position.y][AppComponent.robotAtLastPosition.position.x].type = '_';
    }
    // // la nouvelle position devient le bloc ROBOT
    AppComponent.maison[AppComponent.robot.position.y][AppComponent.robot.position.x].type = 'N';
  }

  static log(message: string) {
    AppComponent.messageService.add(`AppComponent: ${message}`);
  }

}
