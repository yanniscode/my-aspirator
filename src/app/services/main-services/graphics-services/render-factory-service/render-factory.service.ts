import { inject, Injectable } from '@angular/core';
import { MaisonRenderAnimationService } from '../../../maison-services/maison-graphics-services/maison-render-animation-service/maison-render-animation.service';
import { RobotRenderAnimationService } from '../../../robot-services/robot-graphics-services/robot-render-animation-service/robot-render-animation.service';
import { RenderAnimationService } from '../render-animation-service/render-animation.service';

@Injectable({
  providedIn: 'root',
})
export class RenderFactoryService {

  private maisonRenderAnimationService = inject(MaisonRenderAnimationService) as RenderAnimationService;
  private robotRenderAnimationService = inject(RobotRenderAnimationService) as RenderAnimationService;
  // Pattern factory: tableau de Render Animation Services de type spécifiques vers un type générique (chargement des services de rendu sur le Canvas)
  private renderAnimationServicesTab: RenderAnimationService[] = [this.maisonRenderAnimationService, this.robotRenderAnimationService];

  protected ctx!: CanvasRenderingContext2D;

  private readonly WIDTH = 500;
  private readonly HEIGHT = 400;

  /**
   * Affichage des images sur le canvas
   */
  public renderAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    // console.log("RenderFactoryService - renderAnimation()");
    this.ctx = ctx;
    // Efface tout
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    // Dessine tout
    for (let i = 0; i < this.renderAnimationServicesTab.length; i++) {
      this.ctx = this.renderAnimationServicesTab[i].drawObject(this.ctx);
    }
    return this.ctx;
  }
}
