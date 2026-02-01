import { inject, Injectable } from '@angular/core';

import { MaisonModel } from '../../classes/models/maison-model';
import { CellElement } from '../../classes/models/cellElement';
import { Position } from '../../classes/models/position';
import { MessageService } from '../message-service/message.service';

@Injectable({
  providedIn: 'root'
})
export class MaisonService {

  private messageService = inject(MessageService);

  constructor() { }

  // instanciation de la maison:
  private maisonModel = new MaisonModel();

  public getMaisonParams(): MaisonModel {
    console.log("MaisonComponent - getMaisonParams()");

    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    // Création des paramètres de la maison
    const largeurMaison: number = 10;
    const hauteurMaison: number = 8;
    const obstacles: { x: number; y: number; }[] = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    const isNettoyageComplete = false;

    this.maisonModel.largeurMaison = largeurMaison;
    this.maisonModel.hauteurMaison = hauteurMaison;
    this.maisonModel.obstacles = obstacles;
    this.maisonModel.isNettoyageComplete = isNettoyageComplete;

    // appel de la méthode privée creerMaison()
    return this.maisonModel = { ...this.creerMaison() };
  }

  // TODO: pour version Signaux: utiliser des signaux ici ?
  public updateMaisonConfig(robotBasePosition: Position): MaisonModel {
    console.log("MaisonComponent - updateMaisonConfig()");

    // On ajoute la base de chaque robot:
    this.maisonModel.maison[robotBasePosition.y][robotBasePosition.x].cellStack[0].type = 'B';
    return this.maisonModel;
  }

  // TODO: pour version Signaux: utiliser des signaux ici ?
  public updateMaisonCellules(lastPosition: Position): void {
    console.log("MaisonComponent - updateMaisonCellules()");

    console.log("lastPosition.x = " + lastPosition.x);
    console.log("lastPosition.y = " + lastPosition.y);

    // Vérification des null et undefined
    if (lastPosition.x == null || lastPosition.y == null) {
      return;
    }
    // on ne veut pas que la case de la base soit modifiée:
    const lastVisitedCell: CellElement = this.maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0];

    if (lastVisitedCell.type !== 'B') {
      lastVisitedCell.visited = true;
      lastVisitedCell.type = '_';
    }
  }

  private creerMaison(): MaisonModel {
    console.log("MaisonComponent - creerMaison()");

    for (let y = 0; y < this.maisonModel.hauteurMaison; y++) {
      // x = la largeur de la maison
      // y = la hauteur de la maison

      this.maisonModel.maison[y] = [];

      // Création de la maison comme ensemble de blocs d'éléments vides 'O'
      for (let x = 0; x < this.maisonModel.largeurMaison; x++) {
        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        this.maisonModel.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }

    // Ajouter les obstacles 'X' à la maison
    // TODO: pour version Signaux: utiliser des signaux ici ?
    this.maisonModel.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < this.maisonModel.largeurMaison && obs.y >= 0 && obs.y < this.maisonModel.hauteurMaison) {
        this.maisonModel.maison[obs.y][obs.x].cellStack[0].type = 'X';
      }
    });

    return this.maisonModel;
  }

  private log(message: string) {
    this.messageService.add(`MaisonComponent: ${message}`);
  }
}
