import { Injectable, Signal, signal, WritableSignal } from '@angular/core';

import { CellElement } from '../../../classes/models/cellElement';
import { GridPosition } from '../../../classes/models/grid-position';
import { MaisonModel } from '../../../classes/models/maison-model/maison-model';

@Injectable({
  providedIn: 'root'
})
export abstract class MaisonDataService {

  // Instanciation de la maison:
  // Privé et mutable — seul le service peut écrire dedans
  // readonly sur la déclaration TypeScript signifie que la référence au signal ne peut pas être réassignée — pas que le signal lui-même est immuable
  protected readonly _maisonSignal: WritableSignal<MaisonModel> = signal<MaisonModel>(new MaisonModel());
  // Public et lecture seule — les composants peuvent seulement lire
  public readonly maisonSignal: Signal<MaisonModel> = this._maisonSignal.asReadonly();

  /**
   * Mise à jour intégrale de la maison
   *
   * @param maison
   */
  // public updateMaison(maison: MaisonModel): void {
  //   this._maisonSignal.set(maison);
  // }

  // TODO: EVOL - possible refactoring de méthode dans un service API (récupération des données dans des objets JSON / appels HTTP)
  /**
   * initialisation des datas de la Maison
   *
   * @returns
   */
  public abstract setMaisonParams(): void;

  /**
   * Initialisation de la maison
   *
   * @param maisonModel
   */
  protected abstract initMaison(maisonModel: MaisonModel): void;

  /**
   * Construction de la maison (datas)
   *
   * @param largeur
   * @param hauteur
   * @param obstacles
   * @returns
   */
  protected abstract buildMaison(
    largeur: number,
    hauteur: number,
    obstacles: GridPosition[]
  ): CellElement[][];

  /**
   * Mise à jour effective d'une case (maison de type générique)
   *
   * @param newCellElement
   * @returns
   */
  protected updateMaisonCell(newCellElement: CellElement): void {
    console.log("MaisonDataService - updateMaisonCell()");

    const maison: CellElement[][] = this.maisonSignal()?.maison;

    if ((maison?.length <= 0) || maison[0]?.length <= 0) return;

    if (newCellElement.position.row < 0 || newCellElement.position.row >= maison.length
      || newCellElement.position.col < 0 || newCellElement.position.col >= (maison[0]?.length ?? 0)) {
      console.warn(`updateMaisonCell: position (${newCellElement.position.row}, ${newCellElement.position.col}) hors limites`);
      return;
    }

    this._maisonSignal.update(current => ({
      ...current,
      maison: current.maison.map((rowMaison, i) =>
        i === newCellElement.position.row
          ? rowMaison.map((cellElement, j) => j === newCellElement.position.col ? newCellElement : cellElement)
          : rowMaison
      )
    }));
  }

  /**
   * Ajout de la base d'un robot au décors (datas)
   *
   * @param robotBasePosition
   */
  public abstract updateMaisonRobotBase(robotBasePosition: GridPosition): void;

  /**
   * Permet de mettre à jour une case comme étant réservée ou non (utile si plusieurs robots)
   *
   * @param nextPosition
   * @param reservedStatus
   * @returns
   */
  public abstract updateReservedCell(nextPosition: GridPosition, reservedStatus: boolean): void;

  /**
   * Permet de mettre à jour une case comme visitée (datas)
   *
   * @param lastPosition
   * @param visitedStatus
   * @returns
   */
  public abstract updateVisitedCell(lastPosition: GridPosition, visitedStatus: boolean): void;

  /**
   * Vérifie si le nettoyage est terminé
   *
   * @returns
   */
  public abstract toutEstVisite(): boolean;
}
