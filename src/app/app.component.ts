import { Component, OnInit } from '@angular/core';
import { trigger, transition, style } from '@angular/animations';
import { interval, Subscription } from "rxjs";
import { map } from 'rxjs/operators';

import { Position } from './classes/position';
import { RobotAspirator } from './classes/robotaspirator';
import { Cell } from './classes/cell';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [NgFor],
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

  maison: Cell[][] = [[]];
  maisonCopy: Cell[][] = [[]]; // pour gérer l'animation
  grille: Cell[][] = [];

  basePosition: Position = { x: 0, y: 0 };
  robot: RobotAspirator = new RobotAspirator(this.maison, this.basePosition);


  ngOnInit(): void {
    // Création de la maison
    const largeurMaison = 10;
    const hauteurMaison = 8;
    const obstacles: Position[] = [
        { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
        { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
        { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];

    this.maison = this.creerMaison(largeurMaison, hauteurMaison, obstacles);

    // Position de la base de charge
    this.basePosition = { x: 0, y: 0 };
    this.maison[this.basePosition.y][this.basePosition.x].type = 'B';

    // Créer et démarrer le robot
    this.robot = new RobotAspirator(this.maison, this.basePosition);

      // copie de la maison initiale:
      this.maisonCopy = this.maison;

      setTimeout(() => {
        // remplace un élément du tableau par le robot et l'affiche
        this.maison = this.updateMaisonWithRobot();
        // this.afficherMaison();
      }, 1000);

    // démarrage de l'algo principal de nettoyage de la maison:
    this.updateSubscription = interval(250).pipe(
      map(() => {
        this.nettoyer();
      })
    ).subscribe();

    // Afficher l'état final de la maison
    // this.afficherMaison();
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

  // Fonction principale pour nettoyer la maison
  private nettoyer(): void {
    console.log("Début du nettoyage");
    // à chaque tour, la maison est réinitialisé, seule la position du robot sera mise à jour
    this.maison = this.maisonCopy;

    // si la batterie est HS
    if(this.robot.batterie === this.robot.energieNecessairePourRetour()) {
    // while (this.batterie > this.energieNecessairePourRetour()) {
        this.updateSubscription.unsubscribe();
    }

    // si toutes les cellules accessibles sont visitées, retourner à la base
    if (this.toutEstNettoye()) {
        console.log("Toutes les zones accessibles sont nettoyées");
        this.updateSubscription.unsubscribe();
    }

    // // Chercher la prochaine cellule non visitée et s'y diriger
    const prochaineCellule = this.robot.trouverProchaineDestination();

    if (prochaineCellule) {
        this.robot = this.robot.seDeplacerVers(this.robot, prochaineCellule);
        this.maison = this.updateMaisonWithRobot();
    } else {
        // Si aucune cellule n'est trouvée, retourner à la base
        console.log("Aucune cellule accessible non visitée trouvée");
        // Retourner à la base de charge
        console.log(`Batterie: ${this.robot.batterie}%. Retour à la base.`);
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
            if (cell.type !== 'X' && !cell.visited) {
                return false;
            }
        }
    }
    return true;
  }

  // TODO: ajouter le robot ??
  private afficherMaison(): void {
    for (let y = 0; y < this.maison.length; y++) {
      let ligne = '';
      for (let x = 0; x < this.maison[y].length; x++) {
          const cell = this.maison[y][x];
          if (cell.type === 'B') {
              ligne += 'B ';
          } else if (cell.type === 'X') {
              ligne += 'X ';
          } else if (cell.visited) {
              ligne += 'V ';
          } else if (cell.type === 'R') {
            ligne += 'R ';
        }
          else {
              ligne += '_ ';
          }
      }
      console.log(ligne);
    }
  }

  private updateMaisonWithRobot(): Cell[][] {
    // test autre option:
    // mais pb, Robot comme cloné, pas déplacé : copie de la ref, pas de la valeur, et pb aussi malgré slice()
    // this.maison[this.robot.position.x][this.robot.position.y].typeBloc = TypeBloc["ROBOT"];
    // return this.maison.slice();

    return this.maison.map((row) => {
        return row.map((cell) => {
            // Vérifie si la position du robot correspond à la position de la cellule
            if (cell.position.x === this.robot.position.x && cell.position.y === this.robot.position.y) {
                return {
                    ...cell,
                    position: cell.position,
                    type: 'R', // Remplace l'affichage de type vide par le type du robot
                    visited: cell.visited
                };
            }
            return cell; // retourne la cellule inchangée
        });
    });
  }

}