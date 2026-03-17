import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';

import { MaisonModel } from '../../classes/models/maison-model';
import { CellElement } from '../../classes/models/cellElement';
import { GridPosition } from '../../classes/models/grid-position';
import { MessageService } from '../message-service/message.service';

@Injectable({
  providedIn: 'root'
})
export class MaisonService {

  private messageService = inject(MessageService);

  constructor() {
    console.log("MaisonService - constructor()");
  }

  // Instanciation de la maison:
  // Privé et mutable — seul le service peut écrire dedans
  // readonly sur la déclaration TypeScript signifie que la référence au signal ne peut pas être réassignée — pas que le signal lui-même est immuable
  private readonly _maisonSignal: WritableSignal<MaisonModel> = signal<MaisonModel>(new MaisonModel());
  // Public et lecture seule — les composants peuvent seulement lire
  public readonly maisonSignal: Signal<MaisonModel> = this._maisonSignal.asReadonly();

  public updateMaison(maison: MaisonModel): void {
    this._maisonSignal.set(maison);
  }

  public getMaisonParams(): MaisonModel {
    console.log("MaisonService - getMaisonParams()");

    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    // Création des paramètres de la maison
    const largeurMaison: number = 10;
    const hauteurMaison: number = 8;
    const obstacles: GridPosition[] = [
      { row: 3, col: 2 }, { row: 4, col: 2 }, { row: 4, col: 3 },
      { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 },
      { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 6, col: 6 }
    ];

    const isNettoyageComplete = false;

    const newMaison = new MaisonModel();
    newMaison.largeurMaison = largeurMaison;
    newMaison.hauteurMaison = hauteurMaison;
    newMaison.obstacles = obstacles;
    newMaison.isNettoyageComplete = isNettoyageComplete;

    return newMaison;
  }

  public initMaison(maisonModel: MaisonModel): void {
    this._maisonSignal.set({
      ...new MaisonModel(),
      maison: this.buildMaison(maisonModel.largeurMaison, maisonModel.hauteurMaison, maisonModel.obstacles),
      largeurMaison: maisonModel.largeurMaison,
      hauteurMaison: maisonModel.hauteurMaison,
      obstacles: maisonModel.obstacles,
      isNettoyageComplete: maisonModel.isNettoyageComplete
    });
  }

  private buildMaison(
    largeur: number,
    hauteur: number,
    obstacles: GridPosition[]
  ): CellElement[][] {
    return Array.from({ length: hauteur }, (_, row) =>
      Array.from({ length: largeur }, (_, col) => {
        const cell = new CellElement();
        const isObstacle = obstacles.some(o => o.row === row && o.col === col);
        cell.type = isObstacle ? 'X' : 'O';
        cell.position = new GridPosition(row, col);
        return cell;
      })
    );
  }

  private updateMaisonCell(row: number, col: number, newCellElement: CellElement) {
    const maison = this._maisonSignal().maison;
    if (row < 0 || row >= maison.length || col < 0 || col >= (maison[0]?.length ?? 0)) {
      console.warn(`updateMaisonCell: position (${row}, ${col}) hors limites`);
      return;
    }

    this._maisonSignal.update(current => ({
      ...current,
      maison: current.maison.map((rowMaison, i) =>
        i === row
          ? rowMaison.map((cellElement, j) => j === col ? newCellElement : cellElement)
          : rowMaison
      )
    }));
  }

  public updateMaisonRobotsBases(robotBasePosition: GridPosition): void {
    console.log("MaisonService - updateMaisonRobotsBases()");

    console.log("maison dimensions:",
      this._maisonSignal().maison.length,     // hauteur
      this._maisonSignal().maison[0]?.length  // largeur
    );
    console.log("base position:", robotBasePosition);

    // On ajoute la base de chaque robot:
    const newRobotBaseCell: CellElement = {
      position: { ...robotBasePosition },
      type: 'B',
      visited: false
    };
    this.updateMaisonCell(newRobotBaseCell.position.row, newRobotBaseCell.position.col, newRobotBaseCell);
  }

  public updateMaisonCellules(lastPosition: GridPosition): void {
    console.log("MaisonService - updateMaisonCellules()");

    const maisonModel = this.maisonSignal();
    if (!maisonModel) return;

    // Copie par référence, ici, pas par valeur:
    const lastVisitedCell: CellElement = !maisonModel?.maison[lastPosition.row]
      ? new CellElement
      : maisonModel?.maison[lastPosition.row][lastPosition.col] ? { ...maisonModel?.maison[lastPosition.row][lastPosition.col] } : new CellElement();

    if (!lastVisitedCell) return;

    // Ici, l'update du  signal est automatique car on a une copie par référence
    // On ne veut pas que la case de la base soit modifiée
    if (lastVisitedCell.type !== 'B') {
      lastVisitedCell.visited = true;
      lastVisitedCell.type = '_';
    }

    this.updateMaisonCell(lastVisitedCell.position.row, lastVisitedCell.position.col, lastVisitedCell);
  }

  public toutEstNettoye(): boolean {
    console.log("MaisonService - toutEstNettoye()");
    const maisonModel = this.maisonSignal();
    if (!maisonModel) return true;

    // Vérifier si toutes les cellules accessibles ont été visitées
    return maisonModel.maison.every(row =>
      // row.every() renvoie true pour un mur, une position de base (on ne veut pas savoir s'ils sont visités) ou une cellule visitée,
      // false pour une position non visitée:
      row.every(cell =>
        cell.type === 'X' || cell.type === 'B' || cell.visited
      )
    );
  }

  private log(message: string) {
    this.messageService.add(`MaisonService: ${message}`);
  }
}
