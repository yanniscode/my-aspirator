import { computed, inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { MaisonDataService as MaisonDataService } from '../maison-data.service';
import { CellElement } from '../../../../classes/models/cellElement';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { MaisonModel } from '../../../../classes/models/maison-model/maison-model';
import { Observable } from 'rxjs';
import { CellSelectors } from '../../../../data-access/maison.selector';

@Injectable({
  providedIn: 'root',
})
export class MaisonDataNettoyageService extends MaisonDataService<MaisonModel> {

  private loggerService = inject(LoggerService);

  protected override mockMaisonDatasPath = this.url + "/assets/mock-data-services/mock-maison-data-services/mock-data-maison-nettoyage.json";

  constructor() {
    console.log("MaisonDataNettoyageService - constructor()");
    super();
  }

  public override getJsonData(): Observable<MaisonModel> {
    return this.httpClient.get(this.mockMaisonDatasPath) as Observable<MaisonModel>;
  }

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  /**
   * Appel des paramètres de la Maison (datas)
   *
   * @returns
   */
  public override setMaisonParams(maisonModel: MaisonModel): void {
    console.log("MaisonDataNettoyageService - setMaisonParams()");
    this.initMaison(maisonModel);
  }

  /**
   * Initialisation de la maison (datas)
   *
   * @param maisonModel
   */
  protected override initMaison(maisonModel: MaisonModel): void {
    console.log("MaisonDataNettoyageService - initMaison()");

    // construit le tableau de cellules constituant la maison:
    this.buildMaison(maisonModel.largeurMaison, maisonModel.hauteurMaison, maisonModel.obstacles);
    const maisonCellsTab = this.getMaisonCells(maisonModel.largeurMaison, maisonModel.hauteurMaison);

    this._maisonSignal.set({
      ...new MaisonModel(),
      maison: maisonCellsTab,
      // maison: this.buildMaison(maisonModel.largeurMaison, maisonModel.hauteurMaison, maisonModel.obstacles),
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
  protected override buildMaison(
    largeur: number,
    hauteur: number,
    obstacles: GridPosition[]
  ): void {
    console.log("MaisonDataNettoyageService - buildMaison()");

    Array.from({ length: hauteur }, (_, row) =>
      // return Array.from({ length: hauteur }, (_, row) =>
      Array.from({ length: largeur }, (_, col) => {
        const cell = new CellElement();
        const isObstacle = obstacles.some(o => o.row === row && o.col === col);
        cell.cellType = isObstacle ? 'X' : 'O';
        cell.position = new GridPosition(row, col);

        this.cellStore.addCell(cell.cellType, cell.position);
        // return cell;
      })
    );
  }

  /**
   * Ajout de la base d'un robot à la maison (méthode spécifique au cas où on a des robots avec une base de charge, comme les aspirateurs)
   *
   * @param robotBasePosition
   */
  public updateMaisonRobotBase(robotBasePosition: GridPosition): void {
    console.log("MaisonDataNettoyageService - updateMaisonRobotsBase()");

    console.log("maison dimensions:",
      this.maisonSignal().maison.length,     // hauteur
      this.maisonSignal().maison[0]?.length  // largeur
    );
    console.log("base position:", robotBasePosition);

    // On ajoute la base de chaque robot:

    // TODO: remplacer updateMaisonCell() par:
    // ✅ computed : réactif, recalculé seulement si cells ou targetPosition changent
    const cellAtTarget: Signal<CellElement | undefined> = computed(() => {
      const items = this.cellStore.cells();
      const pos = robotBasePosition;
      return items.find(cell =>
        cell.position.col === pos.col &&
        cell.position.row === pos.row
      );
    })
    if (!cellAtTarget()) return;

    this.cellStore.updateCellType(cellAtTarget()!.cellId, "B");
    this.cellStore.updateCellByPosition(cellAtTarget()!.cellId, robotBasePosition);

    this.updateMaisonCell(cellAtTarget()!);
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
    if (reservedPosition.cellType !== 'B') {
      // On passe la case au status réservé ou non
      reservedPosition.reserved = reservedStatus;

      // A garder pour tester visuellement les positions réservées (au lieu de marquer les positions visitées)
      // reservedPosition.type = "_";
    }

    this.cellStore.updateCellReserved(reservedPosition.cellId, reservedPosition.reserved);
    // this.updateMaisonCell(reservedPosition);
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
    const lastVisitedCell: CellElement = this.getMaisonCellByPosition(lastPosition);
    // Si la cellule est absente ou déjà visitée, on sort de la fonction
    if (!lastVisitedCell || lastVisitedCell.visited) return;

    // Ici, l'update du  signal est automatique car on a une copie par référence

    // On ne veut pas que le status de la base soit modifiée
    if (lastVisitedCell.cellType !== 'B') {
      lastVisitedCell.visited = visitedStatus;
      if (lastVisitedCell.visited) {
        lastVisitedCell.cellType = '_';
      }
    }

    this.cellStore.updateCellVisited(lastVisitedCell.cellId, lastVisitedCell.visited);
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
        cell.cellType === 'X' || cell.cellType === 'B' || cell.visited
      )
    );
  }

  private log(message: string) {
    this.loggerService.add(`MaisonDataNettoyageService: ${message}`);
  }
}
