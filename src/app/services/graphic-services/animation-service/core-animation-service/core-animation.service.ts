import { inject, Injectable } from '@angular/core';
import { MaisonCoreAnimationService } from './maison-core-animation-service/maison-core-animation.service';
import { RobotCoreAnimationService } from './robot-core-animation-service/robot-core-animation.service';

@Injectable({
  providedIn: 'root',
})
export class CoreAnimationService {

  private maisonCoreAnimationService = inject(MaisonCoreAnimationService);
  private robotCoreAnimationService = inject(RobotCoreAnimationService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly WIDTH = 500;
  private readonly HEIGHT = 400;

  /**
 * Affichage des images sur le canvas
 */
  public renderAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    // console.log("CoreAnimationService - render()");
    this.ctx = ctx;
    // Efface tout
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    // Dessine tout
    this.ctx = this.maisonCoreAnimationService.drawMaison(this.ctx);
    this.ctx = this.robotCoreAnimationService.drawRobots(this.ctx);

    return this.ctx;
  }
}
