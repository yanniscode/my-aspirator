import { Injectable } from '@angular/core';

import { MaisonModel } from '../../classes/models/maison-model';
import { CellElement } from '../../classes/models/cellElement';
import { Position } from '../../classes/models/position';

@Injectable({
  providedIn: 'root'
})
export class MaisonService {

  constructor() { }

  public getMaisonParams(): MaisonModel {

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

    // instanciation de la maison:
    let maisonModel = new MaisonModel();

    maisonModel.largeurMaison = largeurMaison;
    maisonModel.hauteurMaison = hauteurMaison;
    maisonModel.obstacles = obstacles;
    maisonModel.isNettoyageComplete = isNettoyageComplete;

    // appel de la méthode privée creerMaison()
    return maisonModel = { ...this.creerMaison(maisonModel) };
  }

  private creerMaison(maisonModel: MaisonModel): MaisonModel {
    console.log("MaisonComponent creerMaison()");

    for (let y = 0; y < maisonModel.hauteurMaison; y++) {
      // x = la largeur de la maison
      // y = la hauteur de la maison

      maisonModel.maison[y] = [];

      // Création de la maison comme ensemble de blocs d'éléments vides 'O'
      for (let x = 0; x < maisonModel.largeurMaison; x++) {
        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        maisonModel.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }

    // Ajouter les obstacles 'X' à la maison
    maisonModel.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < maisonModel.largeurMaison && obs.y >= 0 && obs.y < maisonModel.hauteurMaison) {
        maisonModel.maison[obs.y][obs.x].cellStack[0].type = 'X';
      }
    });

    return maisonModel;
  }

  public updateMaisonConfig(maisonModel: MaisonModel, robotBasePosition: Position): MaisonModel {
    // On ajoute la base de chaque robot:
    maisonModel.maison[robotBasePosition.y][robotBasePosition.x].cellStack[0].type = 'B';
    return maisonModel;
  }

  public updateMaisonCells(maisonModel: MaisonModel, lastPosition: Position): void {
    console.log("MaisonComponent updateMaisonView()");
    console.log("lastPosition.x = " + lastPosition.x);
    console.log("lastPosition.y = " + lastPosition.y);

    // Vérification des null et undefined
    if (lastPosition.x == null || lastPosition.y == null) {
      return;
    }
    // on ne veut pas que la case de la base soit modifiée:
    const lastVisitedCell: CellElement = maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0];

    if (lastVisitedCell.type !== 'B') {
      lastVisitedCell.visited = true;
      lastVisitedCell.type = '_';
    }
  }
}
