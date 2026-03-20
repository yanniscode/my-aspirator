import { inject, Injectable } from '@angular/core';
import { MaisonService } from './maison.service';
import { CellElement } from '../../classes/models/cellElement';
import { GridPosition } from '../../classes/models/grid-position';
import { MaisonModel } from '../../classes/models/maison-model';
import { LoggerService } from '../logger-service/logger.service';

@Injectable({
  providedIn: 'root'
})
export class MaisonNettoyageService extends MaisonService {

  private loggerService = inject(LoggerService);

  constructor() {
    console.log("MaisonNettoyageService - constructor()");
    super();
  }

  // TODO: possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  /**
   * Appel des paramètres de la Maison (datas)
   *
   * @returns
   */
  public getMaisonParams(): MaisonModel {
    console.log("MaisonNettoyageService - getMaisonParams()");

    // Création des paramètres de la maison
    const largeurMaison: number = 10;
    const hauteurMaison: number = 8;

    // const obstacles: GridPosition[] = [];
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

  /**
   * Initialisation de la maison (datas)
   *
   * @param maisonModel
   */
  public initMaison(maisonModel: MaisonModel): void {
    console.log("MaisonNettoyageService - initMaison()");

    this._maisonSignal.set({
      ...new MaisonModel(),
      maison: this.buildMaison(maisonModel.largeurMaison, maisonModel.hauteurMaison, maisonModel.obstacles),
      largeurMaison: maisonModel.largeurMaison,
      hauteurMaison: maisonModel.hauteurMaison,
      obstacles: maisonModel.obstacles,
      isNettoyageComplete: maisonModel.isNettoyageComplete
    });
  }

  /**
   * Construction de la maison (datas)
   *
   * @param largeur
   * @param hauteur
   * @param obstacles
   * @returns
   */
  protected buildMaison(
    largeur: number,
    hauteur: number,
    obstacles: GridPosition[]
  ): CellElement[][] {
    console.log("MaisonNettoyageService - buildMaison()");

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

  /**
   * Ajout de la base d'un robot au décors (datas)
   *
   * @param robotBasePosition
   */
  public updateMaisonRobotBase(robotBasePosition: GridPosition): void {
    console.log("MaisonNettoyageService - updateMaisonRobotsBase()");

    console.log("maison dimensions:",
      this._maisonSignal().maison.length,     // hauteur
      this._maisonSignal().maison[0]?.length  // largeur
    );
    console.log("base position:", robotBasePosition);

    // On ajoute la base de chaque robot:
    const newRobotBaseCell: CellElement = {
      position: { ...robotBasePosition },
      type: 'B',
      visited: false,
      reserved: false
    };
    this.updateMaisonCell(newRobotBaseCell);
  }

  /**
   * Permet de mettre à jour une case comme étant réservée ou non (utile si plusieurs robots)
   *
   * @param nextPosition
   * @param reservedStatus
   * @returns
   */
  public updateReservedCell(nextPosition: GridPosition, reservedStatus: boolean): void {
    console.log("MaisonNettoyageService - updateReservedCell()");

    const maisonModel = this.maisonSignal();
    if (!maisonModel) return;

    // Copie par référence, ici, pas par valeur:
    const reservedPosition: CellElement = !maisonModel?.maison[nextPosition.row]
      ? new CellElement
      : maisonModel?.maison[nextPosition.row][nextPosition.col] ? { ...maisonModel?.maison[nextPosition.row][nextPosition.col] } : new CellElement();

    if (!reservedPosition) return;

    // Ici, l'update du  signal est automatique car on a une copie par référence

    // On ne veut pas que le status de la base soit modifiée
    if (reservedPosition.type !== 'B') {
      // On passe la case au status réservé ou non
      reservedPosition.reserved = reservedStatus;
    }

    this.updateMaisonCell(reservedPosition);
  }

  /**
   * Permet de mettre à jour une case comme visitée (datas)
   *
   * @param lastPosition
   * @param visitedStatus
   * @returns
   */
  public updateVisitedCell(lastPosition: GridPosition, visitedStatus: boolean): void {
    console.log("MaisonNettoyageService - updateVisitedCell()");

    const maisonModel = this.maisonSignal();
    if (!maisonModel) return;

    // Copie par référence, ici, pas par valeur:
    const lastVisitedCell: CellElement = !maisonModel?.maison[lastPosition.row]
      ? new CellElement
      : maisonModel?.maison[lastPosition.row][lastPosition.col] ? { ...maisonModel?.maison[lastPosition.row][lastPosition.col] } : new CellElement();

    if (!lastVisitedCell) return;

    // Ici, l'update du  signal est automatique car on a une copie par référence

    // On ne veut pas que le status de la base soit modifiée
    if (lastVisitedCell.type !== 'B') {
      lastVisitedCell.visited = visitedStatus;
      if (lastVisitedCell.visited) {
        lastVisitedCell.type = '_';
      }
    }

    this.updateMaisonCell(lastVisitedCell);
  }

  /**
   * Vérifie si le nettoyage est terminé
   *
   * @returns
   */
  public toutEstVisite(): boolean {
    console.log("MaisonNettoyageService - toutEstNettoye()");
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
    this.loggerService.add(`MaisonNettoyageService: ${message}`);
  }
}
