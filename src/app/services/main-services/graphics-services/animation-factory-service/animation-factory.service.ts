import { inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { AssetService } from '../asset-service/asset.service';
import { AssetMaisonService } from '../../../maison-services/maison-graphics-services/asset-maison-service/asset-maison.service';
import { AssetRobotService } from '../../../robot-services/robot-graphics-services/asset-robot-service/asset-robot.service';
import { RobotDataFactoryService } from '../../../robot-services/robot-data-factory-service/robot-data-factory.service';
import { RobotModel } from '../../../../classes/models/robot-model/robot-model';
import { RobotDataService } from '../../../robot-services/robot-data-services/robot-data.service';
import { RobotActionAspiromanService } from '../../../robot-services/robot-action-services/robot-action-aspiroman-service/robot-action-aspiroman.service';
import { MaisonRenderAnimationService } from '../../../maison-services/maison-graphics-services/maison-render-animation-service/maison-render-animation.service';
import { RobotAspiromanRenderAnimationService } from '../../../robot-services/robot-graphics-services/robot-aspiroman-render-animation-service/robot-aspiroman-render-animation.service';
import { RenderAnimationService } from '../render-animation-service/render-animation.service';
import { RobotActionService } from '../../../robot-services/robot-action-services/robot-action.service';
import { RobotActionAspiratorService } from '../../../robot-services/robot-action-services/robot-action-aspirator-service/robot-action-aspirator.service';
import { RobotAspiratorRenderAnimationService } from '../../../robot-services/robot-graphics-services/robot-aspirator-render-animation-service/robot-aspirator-render-animation.service';

@Injectable({
  providedIn: 'root',
})
export class AnimationFactoryService {

  private robotDataService = inject(RobotDataService);
  private robotDataFactoryService = inject(RobotDataFactoryService)
  private assetMaisonService = inject(AssetMaisonService) as AssetService;
  private assetRobotService = inject(AssetRobotService) as AssetService;
  private assetServicesTab: AssetService[] = [this.assetMaisonService, this.assetRobotService];

  private robotActionAspiratorService = inject(RobotActionAspiratorService) as RobotActionService;
  private robotActionAspiromanService = inject(RobotActionAspiromanService) as RobotActionService;
  private robotActionServicesTab: RobotActionService[] = [this.robotActionAspiratorService, this.robotActionAspiromanService];

  private maisonRenderAnimationService = inject(MaisonRenderAnimationService) as RenderAnimationService;
  private robotAspiratorRenderAnimationService = inject(RobotAspiratorRenderAnimationService) as RenderAnimationService;
  private robotAspiromanRenderAnimationService = inject(RobotAspiromanRenderAnimationService) as RenderAnimationService;
  private robotRenderAnimationServicesTab: RenderAnimationService[] = [this.maisonRenderAnimationService, this.robotAspiratorRenderAnimationService, this.robotAspiromanRenderAnimationService];

  public robotSignals: Map<string, Signal<RobotModel>> = this.robotDataService.robotSignals;

  protected ctx!: CanvasRenderingContext2D;

  private readonly ROW_COLOR = 'rgb(0, 140, 133)'; // tr-maison: background

  /* Variables pour la Vue: */

  // Variable vérifiant si l'animation est en cours
  protected isRunning = false;

  // Animation des robots: id de la trame en cours
  protected animationFrameId?: number;

  // Configuration de l'animation
  protected readonly STEP_DURATION = 600; // Durée d'un déplacement complet (ms)

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
    this.ctx = this.startAnimation(ctx);

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
    this.onRobotsPause(ctx);
  }

  /**
   * Méthode principale de déclenchement de l'animation de la Map de robots
   *
   * @returns void
   */
  public startAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("RobotAspiromanAnimationService - startAnimation()");
    this.ctx = ctx;

    if (this.robotSignals.size <= 0) return this.ctx;

    // on ne démarre ici que si l'animation n'est pas encore activée
    if (this.isRunning) return this.ctx;
    this.isRunning = true;

    let lastStepTime = performance.now();
    let progress = 0;

    console.log("animationProgress = " + this.robotDataService.animationProgress());
    console.log("progress = " + progress);

    this.robotDataService.animationProgress.set(progress);

    // boucle générale de l'animation
    const animate = (currentTime: number) => {

      const deltaTime = currentTime - lastStepTime;

      const sequenceEnded = deltaTime >= this.STEP_DURATION;

      // on termine la séquence actuelle avant de mettre en pause l'animation
      if (!this.isRunning && sequenceEnded) {
        console.log("pauseAllAnimation 1");
        this.pauseAllAnimation();
        return this.ctx;
      }
      // Nouvelle direction selon la durée de STEP_DURATION
      else if (sequenceEnded) {
        // s'il n'y a plus de robot actif à la fin de la séquence d'animation, on stoppe directement l'animation
        if (!this.robotDataService.hasActiveRobots()) {
          console.log("pauseAllAnimation 2");

          this.pauseAllAnimation();
          return this.ctx;
        }

        // 1. Reset du temps
        lastStepTime = currentTime;

        // 2. Calcul des nouvelles directions (qui lit progress = 0)
        this.robotActionServicesTab.forEach(robotActionService => {
          robotActionService.calculateNewDirectionsForAllRobots();
          robotActionService.updateRobotsVisitedCells();
        });

      } else {
        // En cours d'animation
        progress = deltaTime / this.STEP_DURATION;
        // Mettre à jour le signal de progression
        this.robotDataService.animationProgress.set(progress);
      }

      // TODO: garder ici ??
      // Efface tout
      // this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

      // 3. Mise à jour de la position du robot et de la maison (vue)
      this.robotRenderAnimationServicesTab.forEach(robotRenderAnimationService => {
        this.ctx = robotRenderAnimationService.drawObject(this.ctx);
      });

      this.animationFrameId = requestAnimationFrame(animate);

      return this.ctx;
    };

    this.robotActionServicesTab.forEach(robotActionService => {
      robotActionService.calculateNewDirectionsForAllRobots();
      robotActionService.updateRobotsVisitedCells();
    });

    // TODO: garder ici ??
    // Efface tout
    // this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    // Mise à jour de la position du robot et de la maison (vue)
    this.ctx = this.maisonRenderAnimationService.drawObject(this.ctx);
    this.robotRenderAnimationServicesTab.forEach(robotRenderAnimationService => {
      this.ctx = robotRenderAnimationService.drawObject(this.ctx);
    });
    this.animationFrameId = requestAnimationFrame(animate);

    return this.ctx;
  }

  /**
   * Méthode liée à la mise en pause au clic de l'animation
   */
  public onRobotsPause(ctx: CanvasRenderingContext2D): void {
    console.log("RobotAspiromanAnimationService - onRobotsPause()");
    this.ctx = ctx;

    this.isRunning = false;
    console.log('Service de robots mis en pause');
  }

  /**
   * Mise en pause automatique (sans clic) de l'animation (par exemple: en fin de parcours pour tous les robots, s'ils sont inactifs)
   */
  private pauseAllAnimation(): void {
    console.log("RobotAspiromanAnimationService - pauseAllAnimation()");

    console.log('Animation stopped');
    // important pour stopper l'animation quand plus de robot actif:
    this.isRunning = false;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    // On ne supprime pas la map de signaux pour une simple mise en pause
  }
}
