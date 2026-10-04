import { inject, Injectable } from '@angular/core';
import { MaisonDataNettoyageService } from '../../maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { AssetMaisonService } from '../asset-maison-service/asset-maison.service';
import { RenderAnimationService } from '../../../main-services/graphics-services/render-animation-service/render-animation.service';
import { RobotAspiratorModel } from '../../../../classes/models/robot-model/robot-aspirator-model/robot-aspirator-model';
import { CellStore } from '../../../../maison.signal-store';
import { CellsStateModel } from '../../../../data-access/maison.model';

@Injectable({
  providedIn: 'root',
})
export abstract class MaisonRenderAnimationService extends RenderAnimationService<CellsStateModel> {

  private assetMaisonService = inject(AssetMaisonService);

  private cellStore = inject(CellStore);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px
  // TODO: modifier l'espacement des cellules ici
  private readonly CELL_PADDING = 6;      // td-maison: padding - ex: 0.5rem (≈ 8px)
  private readonly ROW_COLOR = 'rgb(0, 140, 133)';      // tr-maison: background

  /**
   *
   * @param ctx
   * @returns ctx
   */
  public override drawObject(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("MaisonRenderAnimationService - drawObject()");

    // récupération du canvas avec ses données pour ajouter les données de la maison
    this.ctx = ctx;

    // TODO: revoir si on utiliser le store car Cell() = tab à 1 dimension, maison la maison: 2 !
    this.cellStore.maisonGrid().forEach((row, rowIndex) => {

      //  tr-maison → background: rgb(0, 140, 133)
      // On peint d'abord toute la ligne en vert
      this.ctx.fillStyle = this.ROW_COLOR;
      this.ctx.fillRect(
        0,
        rowIndex * this.CELL_SIZE,
        this.cellStore.maisonGrid()[0].length * this.CELL_SIZE,  // largeur totale de la ligne
        this.CELL_SIZE
      );

      row.forEach((cell, colIndex) => {
        const x = colIndex * this.CELL_SIZE;
        const y = rowIndex * this.CELL_SIZE;

        //  td-maison → border-style: none (pas de strokeRect)
        //  td-maison → text-align: center + padding: 0.5rem
        // Le padding s'applique des deux côtés → innerSize réduit de 2 * padding
        const innerSize = this.CELL_SIZE - this.CELL_PADDING * 2;  // 50 - 12 = 38px

        //  Centrage horizontal équivalent à text-align: center
        const offsetX = (this.CELL_SIZE - innerSize) / 2;
        const offsetY = (this.CELL_SIZE - innerSize) / 2;

        const img: HTMLImageElement | undefined = this.assetMaisonService.getImageForCell(cell.cellType);
        if (img) {
          this.ctx.drawImage(
            img,
            x + offsetX,   // centré horizontalement
            y + offsetY,   // centré verticalement
            innerSize,
            innerSize
          );
        }
      });
    });
    return this.ctx;
  }

  /**
   * @override
   *
   * @param robot
   */
  protected abstract override getRobotCtxFrame(robot: RobotAspiratorModel): HTMLImageElement;

  /**
   * @override
   *
   * @param robot
   * @param x
   * @param y
   */
  protected abstract override drawRobotLabels(robot: RobotAspiratorModel, x: number, y: number): void;
}
