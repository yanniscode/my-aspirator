import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { interval, Subscription } from "rxjs";
import { map } from 'rxjs/operators';
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
        animate('50ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
          animate('50ms ease-out', style({ opacity: 0 }))
      ])
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
  basePosition: Position = { x: 0, y: 0 };
  robot: RobotAspirator;
  robotAtLastPosition: RobotAspirator;

  constructor(private messageService: MessageService) {
    this.messageService = messageService;

    this.initMaisonConfig();

    this.robot = new RobotAspirator(this.messageService, this.basePosition);
    // copie de la maison initiale (clone profond par valeur)
    this.robotAtLastPosition = structuredClone(this.robot);
  }

  private initMaisonConfig(): void {
    // Création de la maison
    this.largeurMaison = 10;
    this.hauteurMaison = 8;
    this.obstacles = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    this.basePosition = { x: 0, y: 0 };
    this.creerMaison(this.largeurMaison, this.hauteurMaison, this.obstacles, this.basePosition);
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
    AppComponent.maison[this.basePosition.y][this.basePosition.x].type = 'B';
    AppComponent.maison[this.basePosition.y][this.basePosition.x].visited = true;
  }

  ngOnInit(): void {
    this.startIntro();
  }

  startIntro(): void {
    // Création de la maison
    this.initMaisonConfig();

    // Créer et démarrer le robot
    // rafraîchissement de l'affichage de la maison avec le robot à sa nouvelle position
    this.robot = new RobotAspirator(this.messageService, this.basePosition);

    setTimeout(() => {
      // remplace un élément du tableau par le robot et l'affiche
      this.updateMaisonWithRobot(this.toutEstNettoye());
      // this.afficherMaison();
    }, 1000);
  }

  startRobot(): void {
    // démarrage de l'algo principal de nettoyage de la maison:
    this.log("Début du nettoyage");
    this.updateSubscription = interval(250).pipe(
      map(() => {
        this.nettoyer();
      })
    ).subscribe();
  }

  pauseRobot(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  // Fonction principale pour nettoyer la maison
  private nettoyer(): void {
    // rafraîchissement de l'affichage du labyrinthe avec le robot à sa nouvelle position
    this.robotAtLastPosition = structuredClone(this.robot);

    // si la batterie est HS
    if (this.robot.batterie <= this.robot.energieNecessairePourRetour()) {
      // while (this.batterie > this.energieNecessairePourRetour()) {
      this.updateSubscription.unsubscribe();
    }

    // si toutes les cellules accessibles sont visitées, retourner à la base
    if (this.toutEstNettoye()) {
      this.log("Toutes les zones accessibles sont nettoyées");
    }

    // // Chercher la prochaine cellule non visitée et s'y diriger
    const prochaineCellule = this.robot.trouverProchaineDestination();

    if (prochaineCellule) {
      this.robot = this.robot.seDeplacerVers(this.robot, prochaineCellule);
      this.updateMaisonWithRobot(this.toutEstNettoye());
    } else {
      // Si aucune cellule n'est trouvée, retourner à la base
      this.log("Aucune cellule accessible non visitée trouvée");
      // Retourner à la base de charge
      this.log(`Batterie: ${this.robot.batterie}%. Retour à la base.`);
      this.robot = this.robot.retournerALaBase(this.robot);
      this.updateMaisonWithRobot(this.toutEstNettoye());
      this.updateSubscription.unsubscribe();
      this.startIntro();
    }
  }

  // Vérifier si toutes les cellules accessibles ont été visitées
  private toutEstNettoye(): boolean {
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

  private updateMaisonWithRobot(toutEstNettoye: boolean): void {
    // l'ancienne position du robot devient la BASE, ou bien un bloc VISITE,
    // sauf au dernier tour (toutEstNettoye === true)
    if(AppComponent.maison[this.basePosition.y][this.basePosition.x].type === 'N') {
      // si le robot quitte la base, la base est de nouveau affichée:
      AppComponent.maison[this.robotAtLastPosition.position.y][this.robotAtLastPosition.position.x].type = 'B';
    } else if (!toutEstNettoye
      // si le robot quitte une position autre que la base et que tout n'est pas nettoyé, la position devient "visitée"
      && AppComponent.maison[this.robotAtLastPosition.position.y][this.robotAtLastPosition.position.x].type !== 'B') {
      AppComponent.maison[this.robotAtLastPosition.position.y][this.robotAtLastPosition.position.x].type = '_';
    }
    // la nouvelle position devient le bloc ROBOT
    AppComponent.maison[this.robot.position.y][this.robot.position.x].type = 'N';
  }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

}
