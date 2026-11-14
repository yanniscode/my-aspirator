import { inject, Injectable } from '@angular/core';
import { AssetRobotService } from '../asset-robot-service/asset-robot.service';
import { RenderAnimationService } from '../../../main-services/graphics-services/render-animation-service/render-animation.service';
import { RobotAspiromanDataService } from '../../robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';
import { Aspiroman } from '../../../../data-access/robot-data-access/robot.model';
import { Direction } from '../../../../classes/utils/direction';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiromanRenderAnimationService extends RenderAnimationService<Aspiroman> {

  private robotAspiromanDataService = inject(RobotAspiromanDataService);
  private assetRobotService = inject(AssetRobotService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;  // largeur d'une cellule de la maison
  private readonly HEIGHT = 400;    // hauteur de la maison

  constructor() {
    super();
  }

  public override drawObject(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    //     console.log("RobotAspiromanRenderAnimationService - drawObject()");

    this.ctx = ctx;

    const playersTab: Aspiroman[] = this.robotStore.players();
    if (!playersTab) return this.ctx;

    playersTab.forEach(player => {

      let x: number;
      let y: number;

      // ✅ La position dérive TOUJOURS de la progression de déplacement.
      // Pour un joueur éliminé, playDeathAnimation l'a épinglée à 1
      // → interpolation = targetCoordinate = position actuelle, figée.
      const animationPlayerProgSignal = this.robotAspiromanDataService.getPlayerProg(player.robotId);
      if (!animationPlayerProgSignal) return;

      const progress: number = animationPlayerProgSignal();

      const interpX = player.startCoordinate.x + (player.targetCoordinate.x - player.startCoordinate.x) * progress;
      const interpY = player.startCoordinate.y + (player.targetCoordinate.y - player.startCoordinate.y) * progress;

      x = interpX + (this.CELL_SIZE - player.robotWidth) / 2;
      y = interpY + (this.CELL_SIZE - player.robotWidth) / 2;

      const robotImage: HTMLImageElement | undefined = this.getRobotCtxFrame(player);
      if (!robotImage) {
        console.warn('Image robot non chargée');
        this.ctx.restore();
        return;
      }

      this.ctx.save();

      this.ctx.drawImage(robotImage, x, y, player.robotWidth, player.robotWidth);
      this.drawRobotLabels(player, x, y);

      this.ctx.restore();

      return;
    });

    return this.ctx;
  }

  /**
   *
   * @param robot
   * @returns
   */
  protected override getRobotCtxFrame(robot: Aspiroman): HTMLImageElement | undefined {
    if (robot.robotType !== "player") return;

    // ✅ Une seule source : deathProg (0 = vivant, 1 = mort)
    const deathProg = this.robotAspiromanDataService.getDeadPlayerProg(robot.robotId);
    const deathProgress = deathProg?.() ?? 0;

    if (deathProgress > 0) {
      // Joeur mort ou résurrection en cours
      // (les frames remontent naturellement puisque deathProg redescend 1 → 0)
      return this.getDeadRobotFrames(deathProgress * 100, robot.robotDirection);
    }

    // Joueur vivant : frames pilotées par la progression de déplacement
    const moveProg = this.robotAspiromanDataService.getPlayerProg(robot.robotId);
    const moveFrame = moveProg ? Number(moveProg().toPrecision(2)) * 100 : 0;
    return this.getLivingRobotFrames(moveFrame, robot.robotDirection);
  }

  private getLivingRobotFrames(robotAnimationFrame: number, robotDirection: Direction): HTMLImageElement | undefined {
    console.log("getLivingRobotFrames !" + robotAnimationFrame);

    if (20 <= robotAnimationFrame && robotAnimationFrame < 40) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robotDirection, 2);
    }
    else if (40 <= robotAnimationFrame && robotAnimationFrame < 60) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robotDirection, 3);
    }
    else if (60 <= robotAnimationFrame && robotAnimationFrame < 80) {
      return this.assetRobotService.getRobotImageByFrameAndDirection(robotDirection, 4);
    }
    else if (80 <= robotAnimationFrame && robotAnimationFrame < 100) { // Attention ! < 100, ici !
      return this.assetRobotService.getRobotImageByFrameAndDirection(robotDirection, 5);
    }
    else {
      // cas où la trame est < 20 ou > 100
      return this.assetRobotService.getRobotImageByFrameAndDirection(robotDirection, 1);
    }
  }

  private getDeadRobotFrames(robotAnimationFrame: number, robotDirection: Direction): HTMLImageElement | undefined {
    console.log("getDeadRobotFrames !" + robotAnimationFrame);
    if (20 <= robotAnimationFrame && robotAnimationFrame < 40) {
      return this.assetRobotService.getRobotDeathImageByFrameAndDirection(robotDirection, 2);
    }
    else if (40 <= robotAnimationFrame && robotAnimationFrame < 60) {
      return this.assetRobotService.getRobotDeathImageByFrameAndDirection(robotDirection, 3);
    }
    else if (60 <= robotAnimationFrame && robotAnimationFrame < 80) {
      return this.assetRobotService.getRobotDeathImageByFrameAndDirection(robotDirection, 4);
    }
    else if (80 <= robotAnimationFrame && robotAnimationFrame <= 100) { // Attention ! <= 100, ici, comme on veut la dernière frame affichée !
      return this.assetRobotService.getRobotDeathImageByFrameAndDirection(robotDirection, 5);
    }
    else {
      // cas où la trame est < 20 ou > 100
      return this.assetRobotService.getRobotDeathImageByFrameAndDirection(robotDirection, 1);
    }
  }

  /**
   *
   * @param robot
   * @param x
   * @param y
   * @returns
   */
  protected override drawRobotLabels(robot: Aspiroman, x: number, y: number): void {
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
      robot.robotId ?? '-1',
      x + robot.robotWidth / 2,
      labelBaseY
    );

    // utilisation du type de RobotModel, pour checker si c'est aspirateur ou autre type
    const robotAspirator: Aspiroman = robot as Aspiroman;
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
