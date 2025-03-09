import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style } from '@angular/animations';
import { interval, Subscription } from "rxjs";
import { map } from 'rxjs/operators';

import { MessageService } from './services/message.service';
import { MessagesComponent } from "./messages/messages.component";

import { Position } from './classes/position';
import { RobotAspirator } from './classes/robotaspirator';
import { Cell } from './classes/cell';

@Component({
  selector: 'app-root',
  imports: [NgFor, FormsModule, MessagesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('maisonAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        // animate('100ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
      //   animate('100ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  title = 'my-aspirator-robot';

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private updateSubscription!: Subscription;

  largeurMaison: number = 10;
  hauteurMaison: number  = 8;
  obstacles: Position[] = [];
  maison: Cell[][] = [[]];
  maisonCopy: Cell[][] = [[]]; // pour gérer l'animation
  grille: Cell[][] = [];

  basePosition: Position = { x: 0, y: 0 };
  robot: RobotAspirator;
  robotLastPosition: RobotAspirator;

  constructor(private messageService: MessageService) {
    this.messageService = messageService;

    this.maison = this.initMaisonConfig();
    // copie de la maison initiale (clone profond par valeur)
    this.maisonCopy = structuredClone(this.maison);

    this.robot = new RobotAspirator(this.messageService, this.maison, this.basePosition);
    this.robotLastPosition = this.robot;
  }

  private initMaisonConfig(): Cell[][] {
    // Création de la maison
    this.largeurMaison = 10;
    this.hauteurMaison = 8;
    this. obstacles = [
        { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
        { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
        { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];

    this.maison = this.creerMaison(this.largeurMaison, this.hauteurMaison, this.obstacles);

    // Position de la base de charge
    this.basePosition = { x: 0, y: 0 };
    this.maison[this.basePosition.y][this.basePosition.x].type = 'B';
    this.maison[this.basePosition.y][this.basePosition.x].visited = true;

    return this.maison;
  }
  
  // Exemple d'utilisation
  private creerMaison(largeur: number, hauteur: number, obstacles: Position[]): Cell[][] {
    this.grille = [];
    // Initialiser la grille
    for (let y = 0; y < hauteur; y++) {
        this.grille[y] = [];
        for (let x = 0; x < largeur; x++) {
            this.grille[y][x] = {
                position: { x, y },
                type: '_',
                visited: false
            };
        }
    }
    // Ajouter les obstacles
    obstacles.forEach(obs => {
        if (obs.x >= 0 && obs.x < largeur && obs.y >= 0 && obs.y < hauteur) {
            this.grille[obs.y][obs.x].type = 'X';
        }
    });
    return this.grille;
  }

  ngOnInit(): void {
    this.startIntro();
  }

  startIntro(): void {

    // Création de la maison
    this.maison = this.initMaisonConfig();
    // copie de la maison initiale (clone profond par valeur)
    // this.maisonCopy = structuredClone(this.maison);

    // Créer et démarrer le robot
    // rafraîchissement de l'affichage du labyrinthe avec le robot à sa nouvelle position
    this.robot = new RobotAspirator(this.messageService, this.maison, this.basePosition);

    setTimeout(() => {
      // remplace un élément du tableau par le robot et l'affiche
      this.maison = this.updateMaisonWithRobot();
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
    // Afficher l'état final de la maison
    // this.afficherMaison();
  }

  pauseRobot(): void {
    if(this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  // Fonction principale pour nettoyer la maison
  private nettoyer(): void {
    // à chaque tour, la maison est réinitialisé, seule la position du robot sera mise à jour
    // copie de la maison initiale (clone profond par valeur)
    this.maison = structuredClone(this.maisonCopy);
    // // this.maison = this.maisonCopy;

    // rafraîchissement de l'affichage du labyrinthe avec le robot à sa nouvelle position
    this.robotLastPosition.position.x = this.robot.position.x;
    this.robotLastPosition.position.y = this.robot.position.y;

    // si la batterie est HS
    if(this.robot.batterie === this.robot.energieNecessairePourRetour()) {
    // while (this.batterie > this.energieNecessairePourRetour()) {
        this.updateSubscription.unsubscribe();
    }

    // si toutes les cellules accessibles sont visitées, retourner à la base
    if (this.toutEstNettoye()) {
        this.log("Toutes les zones accessibles sont nettoyées");
        this.updateSubscription.unsubscribe();
        this.startIntro();
    }

    // // Chercher la prochaine cellule non visitée et s'y diriger
    const prochaineCellule = this.robot.trouverProchaineDestination();

    if (prochaineCellule) {
        this.robot = this.robot.seDeplacerVers(this.robot, prochaineCellule);
        this.maison = this.updateMaisonWithRobot();
    } else {
        // Si aucune cellule n'est trouvée, retourner à la base
        this.log("Aucune cellule accessible non visitée trouvée");
        // Retourner à la base de charge
        this.log(`Batterie: ${this.robot.batterie}%. Retour à la base.`);
        this.robot = this.robot.retournerALaBase(this.robot);
        this.maison = this.updateMaisonWithRobot();
        this.updateSubscription.unsubscribe();
    }
  }
  
  // Vérifier si toutes les cellules accessibles ont été visitées
  private toutEstNettoye(): boolean {
    for (let i = 0; i < this.grille.length; i++) {
        for (let j = 0; j < this.grille[i].length; j++) {
            const cell = this.grille[i][j];
            if (cell.type !== 'X' && cell.type !== 'B' && !cell.visited) {
                return false;
            }
        }
    }
    return true;
  }

  private updateMaisonWithRobot(): Cell[][] {
    // l'ancienne position du robot devient un bloc VISITE
    if(this.maison[this.robotLastPosition.position.y][this.robotLastPosition.position.x].type !== "B") {
      this.maison[this.robotLastPosition.position.y][this.robotLastPosition.position.x].type = "O";
      // this.maison[this.robot.position.y][this.robot.position.x].visited = true;
    }

    // à chaque tour, la maison est réinitialisé : la position du robot et sa position précédente visitée seront mises à jour
    // copie de la maison initiale (clone profond par valeur)
    this.maisonCopy = structuredClone(this.maison);

    // // à chaque tour, la maison est réinitialisé, seule la position du robot sera mise à jour
    // // copie de la maison initiale (clone profond par valeur)
    // this.maison = structuredClone(this.maisonCopy);

    // la nouvelle position devient le bloc ROBOT
    this.maison[this.robot.position.y][this.robot.position.x].type = "N";

    return this.maison;
  }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

}