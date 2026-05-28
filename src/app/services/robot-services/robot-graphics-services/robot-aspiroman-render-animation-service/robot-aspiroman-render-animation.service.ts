import { inject, Injectable, WritableSignal } from '@angular/core';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { AssetRobotService } from '../asset-robot-service/asset-robot.service';
import { RenderAnimationService } from '../../../main-services/graphics-services/render-animation-service/render-animation.service';
import { RobotAspiromanDataService } from '../../robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';
import { AspiromanModel } from '../../../../classes/models/robot-model/aspiroman-model/aspiroman-model';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiromanRenderAnimationService extends RenderAnimationService {

  private robotAspiromanDataService = inject(RobotAspiromanDataService);
  private assetRobotService = inject(AssetRobotService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;  // largeur d'une cellule de la maison
  private readonly HEIGHT = 400;    // hauteur de la maison

  protected readonly aspiromanSignals: Map<string, WritableSignal<AspiromanModel>>
    = this.robotAspiromanDataService.aspiromanSignals;

  public override drawObject(ctx: CanvasRenderingContext2D, mustMove?: boolean): CanvasRenderingContext2D {
    this.ctx = ctx;

    for (const [robotName, robotSignal] of this.aspiromanSignals) {
      const robot: AspiromanModel | undefined = robotSignal();
      if (!robot) continue;

      this.ctx.save();

      let x: number;
      let y: number;

      const animationPlayerProgSignal = this.robotAspiromanDataService?._animationPlayerProgSignals?.get(robot.robotName);
      if (!animationPlayerProgSignal) continue;
      const animationPlayerProgress = animationPlayerProgSignal();

      if (mustMove === true) {
        // Ancienne branche joueur — conservée si jamais mustMove=true est encore utilisé
        const pixelPosition: PixelPosition = this.robotAspiromanDataService
          .updateCurrentCoordinates(robotName, animationPlayerProgress, mustMove);
        x = pixelPosition.x + (this.CELL_SIZE - robot.robotWidth) / 2;
        y = pixelPosition.y + (this.CELL_SIZE - robot.robotWidth) / 2;

      } else {
        // ✅ CORRECTION : interpolation entre startCoordinate et targetCoordinate
        // selon playerAnimationProgress (0 → 1), mis à jour par la boucle joueur.
        const progress: number = animationPlayerProgress;

        const interpX = robot.startCoordinate.x + (robot.targetCoordinate.x - robot.startCoordinate.x) * progress;
        const interpY = robot.startCoordinate.y + (robot.targetCoordinate.y - robot.startCoordinate.y) * progress;

        x = interpX + (this.CELL_SIZE - robot.robotWidth) / 2;
        y = interpY + (this.CELL_SIZE - robot.robotWidth) / 2;
      }

      const robotImage: HTMLImageElement | undefined = this.getRobotCtxFrame(robot, mustMove);
      if (!robotImage) {
        console.warn('Image robot non chargée');
        this.ctx.restore();
        return this.ctx;
      }

      this.ctx.drawImage(robotImage, x, y, robot.robotWidth, robot.robotWidth);
      this.drawRobotLabels(robot, x, y);
      this.ctx.restore();
    }

    return this.ctx;
  }

  /**
   *
   * @param robot
   * @returns
   */
  protected override getRobotCtxFrame(robot: AspiromanModel, mustMove?: boolean): HTMLImageElement | undefined {
    console.log("RobotAspiromanRenderAnimationService - getRobotCtxFrame()");

    if (robot.robotType !== "player") return;

    const animationPlayerProgSignal = this.robotAspiromanDataService?._animationPlayerProgSignals?.get(robot.robotName);
    if (!animationPlayerProgSignal) return this.assetRobotService.getRobotImageByFrameAndDirection(robot.robotDirection, 1);
    const animationPlayerProgress = animationPlayerProgSignal();

    const robotAnimationFrame = (Number(animationPlayerProgress.toPrecision(2)) * 100);

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
  protected override drawRobotLabels(robot: AspiromanModel, x: number, y: number): void {
    // console.log("RobotAspiromanRenderAnimationService - drawRobotLabels()");

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

    // utilisation du type de RobotModel, pour checker si c'est aspirateur ou autre type
    const robotAspirator: AspiromanModel = robot as AspiromanModel;
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
