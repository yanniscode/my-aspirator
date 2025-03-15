import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
  title = 'my-aspirator-robot';

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private updateSubscription!: Subscription;

  largeurMaison: number = 10;
  hauteurMaison: number = 8;
  obstacles: Position[] = [];
  static maison: Cell[][] = [[]];
  get MaisonView() {
    return AppComponent.maison;
  }
  static basePosition: Position = { x: 0, y: 0 };
  static robot: RobotAspirator;
  static robotAtLastPosition: RobotAspirator;

  constructor(private messageService: MessageService) {
    this.messageService = messageService;

    this.initMaisonConfig();

    AppComponent.robot = new RobotAspirator(this.messageService, AppComponent.basePosition);
    // copie de la maison initiale (clone profond par valeur)
    AppComponent.robotAtLastPosition = structuredClone(AppComponent.robot);
  }

  private initMaisonConfig(): void {
    this.log("initMaisonConfig");
    // Création de la maison
    this.largeurMaison = 10;
    this.hauteurMaison = 8;
    this.obstacles = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    AppComponent.basePosition = { x: 0, y: 0 };
    this.creerMaison(this.largeurMaison, this.hauteurMaison, this.obstacles, AppComponent.basePosition);
  }

  private creerMaison(largeur: number, hauteur: number, obstacles: Position[], basePosition: Position): void {
    for (let y = 0; y < hauteur; y++) {
      AppComponent.maison[y] = [];
      for (let x = 0; x < largeur; x++) {
        AppComponent.maison[y][x] = {
          position: { x, y },
          type: 'O',
          visited: false
        };
      }
    }
    // Ajouter les obstacles
    obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < largeur && obs.y >= 0 && obs.y < hauteur) {
        AppComponent.maison[obs.y][obs.x].type = 'X';
      }
    });
    // Position de la base de charge
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].type = 'B';
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].visited = true;
  }

  ngOnInit(): void {
    this.startIntro();
  }

  ngOnDestroy(): void {
    // Se désabonner pour éviter les fuites de mémoire
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  startIntro(): void {
    // Création de la maison
    this.initMaisonConfig();

    // Créer et démarrer le robot
    // rafraîchissement de l'affichage de la maison avec le robot à sa nouvelle position
    AppComponent.robot = new RobotAspirator(this.messageService, AppComponent.basePosition);
    AppComponent.robotAtLastPosition = structuredClone(AppComponent.robot);

    setTimeout(() => {
      // remplace un élément du tableau par le robot et l'affiche
      AppComponent.updateMaisonWithRobot();
      // this.afficherMaison();
    }, 1000);
  }

  startRobot(): void {
    this.log("Début du nettoyage");
    // algo principal de nettoyage de la maison
    this.updateSubscription = AppComponent.robot.nettoyer().subscribe({
      next: () => {
        this.log('next nettoyer...');
      },
      error: (err) => {
        this.log('Erreur nettoyer: ' + err);
      },
      complete: () => {
        this.log('complete nettoyer: Nettoyage ok !');
        // Retourner à la base de charge
        this.log(`Batterie: ${AppComponent.robot.batterie}%. Retour à la base.`);
        // on ne souscrit plus à nettoyer()
        this.updateSubscription.unsubscribe();
        // puis on souscrit à retournerALaBase
        this.updateSubscription = AppComponent.robot.retournerALaBase(AppComponent.robot).subscribe({
          next: (robot) => {
            this.log('next retournerALaBase...');
            this.log(AppComponent.robotAtLastPosition.position.x.toString());
            this.log(AppComponent.robotAtLastPosition.position.y.toString());
            this.log(robot.position.x.toString());
            this.log(robot.position.y.toString());
            // AppComponent.updateMaisonWithRobot();
          },
          error: (err) => {
            this.log('Erreur retournerALaBase: ' + err);
          },
          complete: () => {
            this.log('complete retournerALaBase: ok !');
            this.updateSubscription.unsubscribe();
            this.startIntro();
          }
        });
      }
    });
  }

  pauseRobot(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
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
    if (AppComponent.maison[this.basePosition.y][this.basePosition.x].type === 'N') {
      // si le robot quitte la base, la base est de nouveau affichée:
      AppComponent.maison[AppComponent.robotAtLastPosition.position.y][AppComponent.robotAtLastPosition.position.x].type = 'B';
    } else if (
      // si le robot quitte une position autre que la base et que tout n'est pas nettoyé, la position devient "visitée"
      AppComponent.maison[AppComponent.robotAtLastPosition.position.y][AppComponent.robotAtLastPosition.position.x].type !== 'B') {
      AppComponent.maison[AppComponent.robotAtLastPosition.position.y][AppComponent.robotAtLastPosition.position.x].type = '_';
    }
    // // la nouvelle position devient le bloc ROBOT
    AppComponent.maison[this.robot.position.y][this.robot.position.x].type = 'N';
  }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

}
