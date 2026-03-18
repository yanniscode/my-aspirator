import { inject, Injectable } from '@angular/core';
import { AssetMaisonService } from '../asset-service/asset-maison-service/asset-maison.service';
import { AssetRobotService } from '../asset-service/asset-robot-service/asset-robot.service';

@Injectable({
  providedIn: 'root',
})
export class AnimationFactoryService {

  private assetMaisonService = inject(AssetMaisonService);
  private assetRobotService = inject(AssetRobotService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly ROW_COLOR = 'rgb(0, 140, 133)'; // tr-maison: background

  /**
 * Chargement des images pour le canvas
 */
  public async loadCanvasImages(): Promise<void> {
    console.log("AnimationFactoryService - loadCanvasImages()");

    await this.assetMaisonService.loadAssets();
    await this.assetRobotService.loadAssets();
  }

  /**
* Fix Firefox — le contexte canvas reste en état "lazy"
* jusqu'au premier appel de dessin synchrone.
* On dessine le fond de la maison pour activer le contexte.
*/
  public initCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    console.log("AnimationFactoryService - initCanvasContext()");

    this.ctx = canvas.getContext('2d')!;
    this.ctx.fillStyle = this.ROW_COLOR;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    return this.ctx;
  }
}
