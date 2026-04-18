import { inject, Injectable } from '@angular/core';
import { MaisonDataService as MaisonDataService } from '../maison-data.service';
import { CellElement } from '../../../../classes/models/cellElement';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { MaisonModel } from '../../../../classes/models/maison-model/maison-model';

@Injectable({
  providedIn: 'root'
})
export class MaisonDataNettoyageService extends MaisonDataService {

  private loggerService = inject(LoggerService);

  constructor() {
    console.log("MaisonDataNettoyageService - constructor()");
    super();
  }

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  /**
   * Appel des paramètres de la Maison (datas)
   *
   * @returns
   */
  public setMaisonParams(): void {
    console.log("MaisonDataNettoyageService - setMaisonParams()");

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

    this.initMaison(newMaison);
  }

  /**
   * Initialisation de la maison (datas)
   *
   * @param maisonModel
   */
  protected initMaison(maisonModel: MaisonModel): void {
    console.log("MaisonDataNettoyageService - initMaison()");

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
    console.log("MaisonDataNettoyageService - buildMaison()");

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
   * Ajout de la base d'un robot au décors
   *
   * @param robotBasePosition
   */
  public updateMaisonRobotBase(robotBasePosition: GridPosition): void {
    console.log("MaisonDataNettoyageService - updateMaisonRobotsBase()");

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
      reserved: true
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
    console.log("MaisonDataNettoyageService - updateReservedCell()");

    const maisonModel = this.maisonSignal();
    if (!maisonModel) return;

    // Copie par référence, ici, pas par valeur:
    const reservedPosition: CellElement | undefined = !maisonModel?.maison[nextPosition.row]
      ? undefined
      : maisonModel?.maison[nextPosition.row][nextPosition.col] ? { ...maisonModel?.maison[nextPosition.row][nextPosition.col] } : undefined;

    if (!reservedPosition) return;

    // Ici, l'update du  signal est automatique car on a une copie par référence

    // On ne veut pas que le status de la base soit modifiée
    if (reservedPosition.type !== 'B') {
      // On passe la case au status réservé ou non
      reservedPosition.reserved = reservedStatus;

      // A garder pour tester visuellement les positions réservées (au lieu de marquer les positions visitées)
      // reservedPosition.type = "_";
    }

    this.updateMaisonCell(reservedPosition);
  }

  /**
   * Permet de mettre à jour une case comme visitée
   *
   * @param lastPosition
   * @param visitedStatus
   * @returns
   */
  public updateVisitedCell(lastPosition: GridPosition, visitedStatus: boolean): void {
    console.log("MaisonDataNettoyageService - updateVisitedCell()");

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
    console.log("MaisonDataNettoyageService - toutEstVisite()");
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
    this.loggerService.add(`MaisonDataNettoyageService: ${message}`);
  }
}
