import { inject, Injectable } from '@angular/core';
import { AssetService } from '../asset-service/asset.service';
import { AnimationService } from '../animation-service/animation.service';
import { AssetMaisonService } from '../../../maison-services/maison-graphics-services/asset-maison-service/asset-maison.service';
import { AssetRobotService } from '../../../robot-services/robot-graphics-services/asset-robot-service/asset-robot.service';
import { RobotAnimationService } from '../../../robot-services/robot-graphics-services/robot-animation-service/robot-animation.service';

@Injectable({
  providedIn: 'root',
})
export class AnimationFactoryService {

  private assetMaisonService = inject(AssetMaisonService) as AssetService;
  private assetRobotService = inject(AssetRobotService) as AssetService;
  // pattern factory: tableau d'Asset Services de type spécifiques vers un type générique pour le chargement des images
  private assetServicesTab: AssetService[] = [this.assetMaisonService, this.assetRobotService];

  private robotAnimationService = inject(RobotAnimationService) as AnimationService;
  // pattern factory: tableau d'AnimationService dans un type générique pour l'appel de tous les types de services d'animation
  private animationServicesTab: AnimationService[] = [this.robotAnimationService];

  protected ctx!: CanvasRenderingContext2D;

  private readonly ROW_COLOR = 'rgb(0, 140, 133)'; // tr-maison: background

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

  /**
 * Chargement des images pour le canvas
 */
  public async loadCanvasImages(): Promise<void> {
    console.log("AnimationFactoryService - loadCanvasImages()");

    for (let i = 0; i < this.assetServicesTab.length; i++) {
      await this.assetServicesTab[i].loadAssets();
    }
  }

  /**
   * Méthode qui déclenche l'animation globale
   * 
   * @param ctx 
   * @returns 
   */
  public declencheAnimationService(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("AnimationFactoryService - declencheAnimationService()");
    this.ctx = ctx;

    for (let i = 0; i < this.animationServicesTab.length; i++) {
      console.log("déclenchement de l'animation du robot Aspirateur");
      this.ctx = this.animationServicesTab[i].startAnimation(ctx);
    }
    return this.ctx;
  }

  /**
   * Met en pause selon le type d'animation souhaité
   * 
   * @param ctx 
   * @returns 
   */
  public pauseAnimationService(ctx: CanvasRenderingContext2D): void {
    console.log("AnimationFactoryService - pauseAnimationService()");

    for (let i = 0; i < this.animationServicesTab.length; i++) {
      console.log("déclenchement de l'animation du robot Aspirateur");
      this.robotAnimationService.onRobotsPause(ctx);
    }
  }
}
