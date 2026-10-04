import { computed, inject, Injectable, Signal } from '@angular/core';
import { MaisonDataService as MaisonDataService } from '../maison-data.service';
import { GridPosition } from '../../../../classes/models/grid-position';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { Observable } from 'rxjs';
import { MaisonConfig } from '../../../../classes/config/maison.config';
import { CellElement, newDefaultCell } from '../../../../data-access/maison.model';

@Injectable({
  providedIn: 'root',
})
export class MaisonDataNettoyageService extends MaisonDataService<MaisonConfig> {

  private loggerService = inject(LoggerService);

  protected override mockMaisonDatasPath = this.url + "/assets/mock-data-services/mock-maison-data-services/mock-data-maison-nettoyage.json";

  constructor() {
    console.log("MaisonDataNettoyageService - constructor()");
    super();
  }

  public override getJsonData(): Observable<MaisonConfig> {
    return this.httpClient.get(this.mockMaisonDatasPath) as Observable<MaisonConfig>;
  }

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  /**
   * Appel des paramètres de la Maison (datas)
   *
   * @returns
   */
  public override setMaisonParams(maisonConfig: MaisonConfig): void {
    console.log("MaisonDataNettoyageService - setMaisonParams()");

    const obstacleKeys = new Set(maisonConfig.obstacles.map(o => `${o.row},${o.col}`));

    Array.from({ length: maisonConfig.rows }, (_, row) =>
      Array.from({ length: maisonConfig.cols }, (_, col) => {
        const cell: CellElement = newDefaultCell(
          row,
          col,
          obstacleKeys.has(`${row},${col}`) ? 'X' : 'O'
        );

        const isObstacle = maisonConfig.obstacles.some(o => o.row === row && o.col === col);
        cell.cellType = isObstacle ? 'X' : 'O';

        cell.position = new GridPosition(row, col);

        this.cellStore.addCell(cell.cellType, cell.position);
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
    this.cellStore.updateCellByItsPosition(cellAtTarget()!.cellId, robotBasePosition);
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

    const maisonModel = this.cellStore.maisonGrid();
    if (!maisonModel) return;

    // Récupération de la cellule de la maison à partir du store NGXS:
    const reservedPosition: CellElement | undefined = this.cellStore.cellAtPosition(nextPosition);
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

    const maisonModel = this.cellStore.maisonGrid();
    if (!maisonModel) return;

    // Copie par référence, ici, pas par valeur:
    const lastVisitedCell: CellElement | undefined = this.cellStore.cellAtPosition(lastPosition);
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
  }

  private log(message: string) {
    this.loggerService.add(`MaisonDataNettoyageService: ${message}`);
  }
}
