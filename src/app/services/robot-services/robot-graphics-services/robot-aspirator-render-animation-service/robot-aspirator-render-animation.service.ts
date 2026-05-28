import { inject, Injectable, WritableSignal } from '@angular/core';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { RobotAspiratorModel } from '../../../../classes/models/robot-model/robot-aspirator-model/robot-aspirator-model';
import { AssetRobotService } from '../asset-robot-service/asset-robot.service';
import { RenderAnimationService } from '../../../main-services/graphics-services/render-animation-service/render-animation.service';
import { RobotAspiratorDataService } from '../../robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiratorRenderAnimationService extends RenderAnimationService {

  private robotAspiratorDataService = inject(RobotAspiratorDataService);
  private assetRobotService = inject(AssetRobotService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;  // largeur d'une cellule de la maison
  private readonly HEIGHT = 400;    // hauteur de la maison

  protected readonly robotAspiratorSignals: Map<string, WritableSignal<RobotAspiratorModel>>
    = this.robotAspiratorDataService.robotAspiratorSignals;

  /**
   *
   * @param ctx
   * @returns
   */
  public override drawObject(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("RobotAspiratorRenderAnimationService - drawObject()");

    this.ctx = ctx;

    for (const [robotName, robotSignal] of this.robotAspiratorSignals) {
      const robot: RobotAspiratorModel | undefined = robotSignal();
      if (!robot) continue;

      // save() AVANT toute modification — isole complètement chaque robot
      this.ctx.save();

      // trame d'animation du robot adaptée à sa direction (nord, sud, est, ouest)
      let robotImage: HTMLImageElement | undefined = this.getRobotCtxFrame(robot);

      //  Guard clause — on ne dessine pas si l'image n'est pas chargée
      if (!robotImage) {
        console.warn('Image robot non chargée');
        return this.ctx;
      }

      // mise à jour des coordonnées du robot dans l'espace (en pixels), pour la vue
      const pixelPosition: PixelPosition = this.robotAspiratorDataService.updateCurrentCoordinates(robotName);
      console.log("aspirator - pixelPosition = " + pixelPosition.x + " - " + pixelPosition.y);
      // recentrage du robot dans la cellule
      const x = pixelPosition.x + (this.CELL_SIZE - robot.robotWidth) / 2;
      const y = pixelPosition.y + (this.CELL_SIZE - robot.robotWidth) / 2;
      // console.log("pixelPosition = " + x + " - " + y);

      // Equivalent [style.width.px] / [style.height.px] → aspiroViewSize
      this.ctx.drawImage(
        robotImage,
        x, y,
        robot.robotWidth, robot.robotWidth
      );

      this.drawRobotLabels(robot, x, y);

      // restore() APRÈS tout le rendu du robot
      this.ctx.restore();
    }
    return this.ctx;
  }

  /**
   *
   * @param robot
   * @returns
   */
  protected override getRobotCtxFrame(robot: RobotAspiratorModel): HTMLImageElement | undefined {
    console.log("RobotAspiratorRenderAnimationService - getRobotCtxFrame()");
    console.log("animationProgress = " + this.robotAspiratorDataService._animationBotsProgSignal());

    if (robot.robotType !== "aspirator") return;

    const robotAnimationFrame = (Number(this.robotAspiratorDataService._animationBotsProgSignal().toPrecision(2)) * 100);
    if (!robotAnimationFrame || !robot.isRobotStarted) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robot.robotDirection, 1);
    }

    if (20 <= robotAnimationFrame && robotAnimationFrame < 40) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robot.robotDirection, 2);
    }
    else if (40 <= robotAnimationFrame && robotAnimationFrame < 60) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robot.robotDirection, 3);
    }
    else if (60 <= robotAnimationFrame && robotAnimationFrame < 80) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robot.robotDirection, 4);
    }
    else if (80 <= robotAnimationFrame && robotAnimationFrame < 100) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robot.robotDirection, 5);
    }
    else {
      // cas où la trame est < 20 ou > 100
      return this.assetRobotService.getRobotImageByFrameAndDirection(robot.robotDirection, 1);
    }
  }

  /**
   *
   * @param robot
   * @param x
   * @param y
   * @returns
   */
  protected override drawRobotLabels(robot: RobotAspiratorModel, x: number, y: number): void {
    // console.log("RobotAspiratorRenderAnimationService - drawRobotLabels()");

    const LABEL_HEIGHT = 28;  // hauteur totale des deux labels (12 + 16)

    // Détecte si les labels dépassent du canvas en bas
    const isNearBottom = (y + robot.robotWidth + LABEL_HEIGHT) > this.HEIGHT;

    // Bascule les labels au dessus du robot si trop près du bord
    const labelBaseY = isNearBottom
      ? y - 4                      // au dessus du robot
      : y + robot.robotWidth + 12;   // en dessous du robot

    const batterieOffsetY = isNearBottom ? -14 : 12;  // écart entre les deux labels

    // Label nom
    this.ctx.font = 'bold 8px Arial';
    this.ctx.fillStyle = robot.labelColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      robot.robotName ?? 'Theodule',
      x + robot.robotWidth / 2,
      labelBaseY
    );

    const robotAspirator: RobotAspiratorModel = robot;
    if (!robotAspirator) return;

    // Label batterie (spécifique aux robots avec batteries - ex: aspirateur...)
    this.ctx.font = '8px Arial';
    this.ctx.fillStyle = this.assetRobotService.getRobotBatterieColor(robotAspirator.batterie);
    this.ctx.fillText(
      `${robotAspirator.batterie ?? -1}%`,
      x + robot.robotWidth / 2,
      labelBaseY + batterieOffsetY
    );
  }
}
