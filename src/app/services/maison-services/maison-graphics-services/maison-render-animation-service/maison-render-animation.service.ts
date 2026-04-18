import { inject, Injectable, WritableSignal } from '@angular/core';
import { MaisonDataNettoyageService } from '../../maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { RobotModel } from '../../../../classes/models/robot-model/robot-model';
import { RobotDataService } from '../../../robot-services/robot-data-services/robot-data.service';
import { AssetMaisonService } from '../asset-maison-service/asset-maison.service';
import { RenderAnimationService } from '../../../main-services/graphics-services/render-animation-service/render-animation.service';
import { MaisonModel } from '../../../../classes/models/maison-model/maison-model';

@Injectable({
  providedIn: 'root',
})
export class MaisonRenderAnimationService extends RenderAnimationService {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  private assetMaisonService = inject(AssetMaisonService);
  private robotDataService = inject(RobotDataService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px
  private readonly CELL_PADDING = 6;      // td-maison: padding: 0.5rem (≈ 8px)
  private readonly ROW_COLOR = 'rgb(0, 140, 133)';      // tr-maison: background

  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>>
    = this.robotDataService.robotSignals;

  public drawObject(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("MaisonRenderAnimationService - drawObject()");

    // récupération du canvas avec ses données pour ajouter les données de la maison
    this.ctx = ctx;
    // récupération des données de la maison à partir de son Signal
    const maisonModel: MaisonModel = this.maisonDataNettoyageService.maisonSignal();

    maisonModel.maison.forEach((row, rowIndex) => {

      //  tr-maison → background: rgb(0, 140, 133)
      // On peint d'abord toute la ligne en vert
      this.ctx.fillStyle = this.ROW_COLOR;
      this.ctx.fillRect(
        0,
        rowIndex * this.CELL_SIZE,
        maisonModel.maison[0].length * this.CELL_SIZE,  // largeur totale de la ligne
        this.CELL_SIZE
      );

      row.forEach((cell, colIndex) => {
        const x = colIndex * this.CELL_SIZE;
        const y = rowIndex * this.CELL_SIZE;

        //  td-maison → border-style: none (pas de strokeRect)
        //  td-maison → text-align: center + padding: 0.5rem
        // Le padding s'applique des deux côtés → innerSize réduit de 2 * padding
        const innerSize = this.CELL_SIZE - this.CELL_PADDING * 2;  // 50 - 16 = 34px

        //  Centrage horizontal équivalent à text-align: center
        const offsetX = (this.CELL_SIZE - innerSize) / 2;
        const offsetY = (this.CELL_SIZE - innerSize) / 2;

        const img: HTMLImageElement | undefined = this.assetMaisonService.getImageForCell(cell.type);
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
}
