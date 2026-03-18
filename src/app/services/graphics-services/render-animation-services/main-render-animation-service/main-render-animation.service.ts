import { inject, Injectable } from '@angular/core';
import { RobotRenderAnimationService } from '../robot-render-animation-service/robot-render-animation.service';
import { MaisonRenderAnimationService } from '../maison-render-animation-service/maison-render-animation.service';

@Injectable({
  providedIn: 'root',
})
export class MainRenderAnimationService {

  private maisonRenderAnimationService = inject(MaisonRenderAnimationService);
  private robotRenderAnimationService = inject(RobotRenderAnimationService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly WIDTH = 500;
  private readonly HEIGHT = 400;

  /**
 * Affichage des images sur le canvas
 */
  public renderAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    // console.log("MainRenderAnimationService - render()");
    this.ctx = ctx;
    // Efface tout
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    // Dessine tout
    this.ctx = this.maisonRenderAnimationService.drawMaison(this.ctx);
    this.ctx = this.robotRenderAnimationService.drawRobots(this.ctx);

    return this.ctx;
  }
}
