import { Injectable, OnDestroy, inject, WritableSignal, computed, signal, ElementRef, Signal } from "@angular/core";
import { PixelPosition } from "../../../../classes/models/pixel-position";
import { RobotAspiratorModel } from "../../../../classes/models/robot-aspirator-model";
import { RobotModel } from "../../../../classes/models/robot-model";
import { RobotAspiratorService } from "../../../action-services/robot-action-services/robot-aspirator-service/robot-aspirator.service";
import { LoggerService } from "../../../data-services/logger-service/logger.service";
import { MaisonDataNettoyageService } from "../../../data-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service";
import { RobotDataService } from "../../../data-services/robot-data-services/robot-data.service";
import { AssetMaisonService } from "../../asset-service/asset-maison-service/asset-maison.service";
import { AssetRobotService } from "../../asset-service/asset-robot-service/asset-robot.service";
import { AnimationService } from "../animation.service";

@Injectable({
  providedIn: 'root',
})
export abstract class RobotAspiratorAnimationService extends AnimationService implements OnDestroy {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  private assetMaisonService = inject(AssetMaisonService);
  private assetRobotService = inject(AssetRobotService);
  private robotDataService = inject(RobotDataService);
  public robotAspiratorService = inject(RobotAspiratorService);
  private loggerService = inject(LoggerService);

  protected ctx!: CanvasRenderingContext2D;

  /* Variables de la maison: */

  private readonly WIDTH = 500;
  private readonly HEIGHT = 400;
  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px
  private readonly CELL_PADDING = 8;      // td-maison: padding: 0.5rem (≈ 8px)
  private readonly ROW_COLOR = 'rgb(0, 140, 133)'; // tr-maison: background

  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>>
    = this.robotDataService.robotSignals as Map<string, WritableSignal<RobotModel>>;

  public readonly hasActiveRobots = computed(() =>
    [...this._robotSignals.values()].some(signal => signal()?.isRobotStarted)
  );

  // Variables pour la Vue - animation des robots
  protected animationFrameId?: number;

  protected isRunning = false;


  // Signal pour le progress (0 à 1)
  protected animationProgress = signal(0);

  // Configuration de l'animation
  protected readonly STEP_DURATION = 600; // Durée d'un déplacement complet (ms)

  constructor() {
    super();
    console.log("RobotAnimationService - constructor()");
  }

  /**
 * Fix Firefox — le contexte canvas reste en état "lazy"
 * jusqu'au premier appel de dessin synchrone.
 * On dessine le fond de la maison pour activer le contexte.
 */
  private initCanvasContext(canvas: HTMLCanvasElement): void {
    console.log("RobotAnimationService - initCanvasContext()");

    this.ctx = canvas.getContext('2d')!;
    this.ctx.fillStyle = this.ROW_COLOR;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Chargement des images pour le canvas
   */
  private async loadCanvasImages(): Promise<void> {
    console.log("RobotAnimationService - loadCanvasImages()");

    await this.assetMaisonService.loadAssets();
    await this.assetRobotService.loadAssets();
  }

  public async initialiseAfterView(gameCanvas: ElementRef<HTMLCanvasElement>): Promise<void> {
    console.log("RobotAnimationService - ngAfterViewInit()");

    if (this.isRunning) return;

    const canvas = gameCanvas.nativeElement;
    const maison = this.maisonDataNettoyageService.maisonSignal();
    canvas.width = maison.maison[0].length * this.CELL_SIZE;
    canvas.height = maison.maison.length * this.CELL_SIZE;

    // Fix Firefox
    this.initCanvasContext(canvas);

    // Attente du chargement des images (maison + robots) avant le rendu
    await this.loadCanvasImages();
    this.render();
  }

  /**
* Nettoyage complet du service
*/
  public ngOnDestroy(): void {
    console.log("RobotAnimationService - ngOnDestroy()");

    this.stopAllAnimation();
    console.log('Service de robots arrêté');
  }

  /**
  * Nettoyage complet du service (animation où tous les robots s'arrêtent)
  */
  public onRobotsPause(): void {
    console.log("RobotAnimationService - onRobotsPause()");

    this.isRunning = false;
    console.log('Service de robots mis en pause');
  }

  private stopAllAnimation(): void {
    console.log("RobotAnimationService - stopAllAnimation()");

    console.log('Animation stopped');
    this.isRunning = false;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    // On vide la map de signaux (réinitialisation complète des robots)
    this._robotSignals.clear();
  }

  /**
   * Affichage des images sur le canvas
   */
  public render(): void {
    // console.log("RobotAnimationService - render()");

    // Efface tout
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    // Dessine tout
    this.drawGrille();
    this.drawRobots();
  }

  private drawGrille(): void {
    // console.log("RobotAnimationService - drawGrille()");

    const maison = this.maisonDataNettoyageService.maisonSignal();

    maison.maison.forEach((row, rowIndex) => {

      //  tr-maison → background: rgb(0, 140, 133)
      // On peint d'abord toute la ligne en vert
      this.ctx.fillStyle = this.ROW_COLOR;
      this.ctx.fillRect(
        0,
        rowIndex * this.CELL_SIZE,
        maison.maison[0].length * this.CELL_SIZE,  // largeur totale de la ligne
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
  }

  private drawRobotLabels(robot: RobotModel, x: number, y: number): void {
    // console.log("RobotAnimationService - drawRobotLabels()");

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

  private drawRobots() {
    // console.log("RobotAnimationService - drawRobots()");

    const robotImage: HTMLImageElement = this.assetRobotService.getImage('robot');
    //  Guard clause — on ne dessine pas si l'image n'est pas chargée
    if (!robotImage) {
      console.warn('Image robot non chargée');
      return;
    }

    for (const [robotName, robotSignal] of this._robotSignals) {
      const robot: RobotModel | undefined = robotSignal();
      if (!robot) continue;

      // save() AVANT toute modification — isole complètement chaque robot
      this.ctx.save();

      const pixelPosition: PixelPosition = this.updateCurrentCoordinates(robotName);
      const x = pixelPosition.x;
      const y = pixelPosition.y;

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
  }

  // Computed réactif basé sur le signal animationProgress
  private updateCurrentCoordinates(name: string): PixelPosition {
    // console.log("RobotAnimationService - updateCurrentCoordinates()");

    const robotSignal: Signal<RobotModel | undefined> = this.robotDataService.getRobotSignal(name) as Signal<RobotModel | undefined>;
    if (!robotSignal) return new PixelPosition(-50, -50);
    // console.log(robotSignal);

    const robot: RobotModel | undefined = robotSignal();
    if (!robot) return new PixelPosition(-50, -50);

    // Dépend du signal animationProgress
    const progress = this.animationProgress();

    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    const newXCoordinate = robot.startCoordinate.x + (robot.targetCoordinate.x - robot.startCoordinate.x) * progress;
    const newYCoordinate = robot.startCoordinate.y + (robot.targetCoordinate.y - robot.startCoordinate.y) * progress;

    // Attention: inversion des coordonnées pour l'affichage: col = x, row = y
    return new PixelPosition(newXCoordinate, newYCoordinate);
  };

  protected pauseAllAnimation(): void {
    console.log("RobotAnimationService - pauseAllAnimation()");

    console.log('Animation stopped');
    // important pour stopper l'animation quand plus de robot actif:
    this.isRunning = false;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    // On ne supprime pas la map de signaux pour une simple mise en pause
  }

  // public abstract override startRobotsAnimation(): void;

  /**
* Méthode principale de déclenchement de l'animation de la Map de robots
*
* @returns void
*/
  public startRobotsAnimation(): void {
    console.log("RobotAnimationService - startRobotsAnimation()");

    if (this._robotSignals.size <= 0) return;

    // on ne démarre ici que si l'animation n'est pas encore activée
    if (this.isRunning) return;
    this.isRunning = true;

    let lastStepTime = performance.now();

    const animate = (currentTime: number) => {

      const deltaTime = currentTime - lastStepTime;

      const sequenceEnded = deltaTime >= this.STEP_DURATION;
      // on termine la séquence actuelle avant de mettre en pause l'animation
      if (!this.isRunning && sequenceEnded) {
        this.pauseAllAnimation();
        return;
      }
      // Nouvelle direction selon la durée de STEP_DURATION
      else if (sequenceEnded) {
        // s'il n'y a plus de robot actif à la fin de la séquence d'animation, on stoppe directement l'animation
        if (!this.hasActiveRobots()) {
          this.pauseAllAnimation();
          return;
        }

        // 1. Reset du temps
        lastStepTime = currentTime;
        // 2. Reset du progress à 0
        this.animationProgress.set(0);

        // 3. Calcul des nouvelles directions (qui lit progress = 0)
        // TODO: revoir avec factory pour un appel générique ici (méthode spécifique aux robots aspirateurs, actuellement)
        this.robotAspiratorService.calculateNewDirectionsForAllRobots();
        this.robotAspiratorService.updateRobotsVisitedCells();
      } else {
        // En cours d'animation
        const progress = deltaTime / this.STEP_DURATION;
        // Mettre à jour le signal de progression
        this.animationProgress.set(progress);
      }

      // 4. Mise à jour de la position du robot (vue)
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.robotAspiratorService.calculateNewDirectionsForAllRobots();
    this.robotAspiratorService.updateRobotsVisitedCells();

    // Mise à jour de la position du robot (vue)
    this.render();
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private log(message: string): void {
    this.loggerService.add(`RobotAnimationService: ${message}`);
  }
}
