import { Component, OnInit } from '@angular/core';
import { trigger, transition, style } from '@angular/animations';

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

  maison: Cell[][] = [[]];

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

    // // Position de la base de charge
    const basePosition: Position = { x: 0, y: 0 };
    this.maison[basePosition.y][basePosition.x].type = 'B';

    // // Créer et démarrer le robot
    const robot = new RobotAspirator(this.maison, basePosition);
    robot.nettoyer();

    // // Afficher l'état final de la maison
    this.afficherMaison();
  }

  // Exemple d'utilisation
  private creerMaison(largeur: number, hauteur: number, obstacles: Position[]): Cell[][] {
    const grille: Cell[][] = [];

    // Initialiser la grille
    for (let y = 0; y < hauteur; y++) {
        grille[y] = [];
        for (let x = 0; x < largeur; x++) {
            grille[y][x] = {
                position: { x, y },
                type: '_',
                visited: false
            };
        }
    }

    // Ajouter les obstacles
    obstacles.forEach(obs => {
        if (obs.x >= 0 && obs.x < largeur && obs.y >= 0 && obs.y < hauteur) {
            grille[obs.y][obs.x].type = 'X';
        }
    });

    return grille;
  }

  private afficherMaison(): void {
    for (let y = 0; y < this.maison.length; y++) {
      let ligne = '';
      for (let x = 0; x < this.maison[y].length; x++) {
          const cell = this.maison[y][x];
          if (cell.type === 'B') {
              ligne += 'B ';
          } else if (cell.type === 'X') {
              ligne += '# ';
          } else if (cell.visited) {
              ligne += 'V ';
          } else {
              ligne += '. ';
          }
      }
      console.log(ligne);
    }
  }
}