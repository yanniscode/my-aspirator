import { inject, Injectable, WritableSignal } from '@angular/core';
import { PixelPosition } from '../../../../../classes/models/pixel-position';
import { RobotAspiratorModel } from '../../../../../classes/models/robot-aspirator-model';
import { RobotModel } from '../../../../../classes/models/robot-model';
import { RobotDataService } from '../../../../data-services/robot-data-services/robot-data.service';
import { AssetRobotService } from '../../../asset-service/asset-robot-service/asset-robot.service';

@Injectable({
  providedIn: 'root',
})
export class RobotCoreAnimationService {

  private robotDataService = inject(RobotDataService);
  private assetRobotService = inject(AssetRobotService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly HEIGHT = 400;

  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>>
    = this.robotDataService.robotSignals;

  public drawRobots(ctx: CanvasRenderingContext2D, progress: number): CanvasRenderingContext2D {
    console.log("RobotCoreAnimationService - drawRobots()");

    this.ctx = ctx;

    const robotImage: HTMLImageElement = this.assetRobotService.getImage('robot');
    //  Guard clause — on ne dessine pas si l'image n'est pas chargée
    if (!robotImage) {
      console.warn('Image robot non chargée');
      return this.ctx;
    }

    for (const [robotName, robotSignal] of this._robotSignals) {
      const robot: RobotModel | undefined = robotSignal();
      if (!robot) continue;

      // save() AVANT toute modification — isole complètement chaque robot
      this.ctx.save();

      const pixelPosition: PixelPosition = this.robotDataService.updateCurrentCoordinates(robotName, progress);
      const x = pixelPosition.x;
      const y = pixelPosition.y;
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

  protected drawRobotLabels(robot: RobotModel, x: number, y: number): void {
    // console.log("RobotCoreAnimationService - drawRobotLabels()");

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
    if (robot.robotType === "aspirator") {
      const robotAspirator: RobotAspiratorModel = robot as RobotAspiratorModel;
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
}
