import { inject, Injectable, Signal } from '@angular/core';
import { AssetService } from '../asset-service/asset.service';
import { RobotModel } from '../../../../classes/models/robot-model/robot-model';
import { RenderAnimationService } from '../render-animation-service/render-animation.service';
import { RobotActionService } from '../../../robot-services/robot-action-services/robot-action.service';
import { RenderFactoryService } from '../render-factory-service/render-factory.service';
import { ActionFactoryService } from '../action-factory-service/action-factory.service';
import { AssetFactoryService } from '../asset-factory-service/asset-factory.service';
import { RobotDataFactoryService } from '../../../robot-services/robot-data-factory-service/robot-data-factory.service';
import { RobotActionAspiromanService } from '../../../robot-services/robot-action-services/robot-action-aspiroman-service/robot-action-aspiroman.service';
import { RobotAspiromanRenderAnimationService } from '../../../robot-services/robot-graphics-services/robot-aspiroman-render-animation-service/robot-aspiroman-render-animation.service';

@Injectable({
  providedIn: 'root',
})
export class AnimationFactoryService {

  // ─── Services injectés ──────────────────────────────────────────────────────

  private robotDataFactoryService = inject(RobotDataFactoryService);
  public robotSignals: Map<string, Signal<RobotModel>> = this.robotDataFactoryService.robotSignals;

  private assetFactoryService = inject(AssetFactoryService);
  private assetServicesTab: AssetService[] = this.assetFactoryService.getAssetServicesTab();

  private actionFactoryService = inject(ActionFactoryService);
  private actionServicesTab: RobotActionService[] = this.actionFactoryService.getActionServicesTab();

  private robotActionAspiromanService = inject(RobotActionAspiromanService);

  private renderFactoryService = inject(RenderFactoryService);
  private renderAnimationServicesTab: RenderAnimationService[] = this.renderFactoryService.getRenderAnimationServicesTab();

  private robotAspiromanRenderAnimationService = inject(RobotAspiromanRenderAnimationService);

  // ─── Canvas ─────────────────────────────────────────────────────────────────

  protected ctx!: CanvasRenderingContext2D;

  private readonly ROW_COLOR = 'rgb(0, 140, 133)';
  private readonly WIDTH = 500;
  private readonly HEIGHT = 400;

  // ─── Configuration ──────────────────────────────────────────────────────────

  /** Durée d'un déplacement complet en ms */
  protected readonly STEP_DURATION = 600;

  // ─── État boucle bots (maîtresse du canvas) ──────────────────────────────────

  protected isRunning = false;
  private botsAnimationFrameId?: number;
  private lastBotsStepTime = 0;
  private botsProgress = 0;

  // ─── État boucle joueur (modèle uniquement, pas de rendu) ────────────────────
  //
  // La boucle joueur NE DESSINE PAS. Elle met uniquement à jour
  // animationPlayerProgress (0→1) sur la durée d'un STEP_DURATION.
  // La boucle bots lit ce signal à chaque frame et dessine le joueur.
  // Cela garantit qu'il n'est dessiné qu'une seule fois par frame,
  // quelle que soit l'activité de la boucle joueur.

  public isPlayerRunning = false;
  private playerAnimationFrameId?: number;
  private lastPlayerStepTime = 0;

  // ────────────────────────────────────────────────────────────────────────────
  // Initialisation canvas
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Fix Firefox — le contexte canvas reste en état "lazy"
   * jusqu'au premier appel de dessin synchrone.
   */
  public initCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    console.log('AnimationFactoryService - initCanvasContext()');
    this.ctx = canvas.getContext('2d')!;
    this.ctx.fillStyle = this.ROW_COLOR;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    return this.ctx;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Chargement des assets
  // ────────────────────────────────────────────────────────────────────────────

  public async loadCanvasImages(): Promise<void> {
    console.log('AnimationFactoryService - loadCanvasImages()');
    for (const assetService of this.assetServicesTab) {
      await assetService.loadAssets();
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Point d'entrée principal
  // ────────────────────────────────────────────────────────────────────────────

  public startAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log('AnimationFactoryService - startAnimation()');
    this.ctx = ctx;
    this.ctx = this.startAnimationForBots();
    return this.ctx;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Boucle bots — maîtresse du canvas
  // ────────────────────────────────────────────────────────────────────────────

  public startAnimationForBots(): CanvasRenderingContext2D {
    console.log('AnimationFactoryService - startAnimationForBots()');

    if (this.robotSignals.size <= 0) return this.ctx;
    if (this.isRunning) return this.ctx;

    this.isRunning = true;
    this.lastBotsStepTime = performance.now();
    this.botsProgress = 0;

    this.robotDataFactoryService.animationProgress.set(this.botsProgress);
    this.calculateAndUpdateBots();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastBotsStepTime;
      const sequenceEnded = deltaTime >= this.STEP_DURATION;

      // Pause demandée depuis l'UI : on attend la fin du step en cours
      if (!this.isRunning && sequenceEnded) {
        console.log('AnimationFactoryService - bots : pause, fin de step');
        this.stopBotsAnimation();
        return;
      }

      if (sequenceEnded) {
        if (!this.robotDataFactoryService.hasActiveRobots()) {
          console.log('AnimationFactoryService - bots : plus de robots actifs, arrêt');
          this.stopBotsAnimation();
          return;
        }
        // Nouvelle séquence
        this.lastBotsStepTime = currentTime;
        this.botsProgress = 0;
        this.calculateAndUpdateBots();
      } else {
        this.botsProgress = deltaTime / this.STEP_DURATION;
        this.robotDataFactoryService.animationProgress.set(this.botsProgress);
      }

      // ── Rendu unique par frame ──────────────────────────────────────────────
      // 1. Tous les bots IA
      this.renderAnimationServicesTab.forEach(service => {
        this.ctx = service.drawObject(this.ctx);
      });

      // 2. Le joueur — TOUJOURS dessiné ici, jamais ailleurs.
      //    robotAspiromanRenderAnimationService lit animationPlayerProgress
      //    (mis à jour par la boucle joueur) pour interpoler la position.
      this.ctx = this.robotAspiromanRenderAnimationService.drawObject(this.ctx, false);
      // ───────────────────────────────────────────────────────────────────────

      this.botsAnimationFrameId = requestAnimationFrame(animate);
    };

    this.botsAnimationFrameId = requestAnimationFrame(animate);
    return this.ctx;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Boucle joueur — modèle uniquement, AUCUN dessin
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Déclenche un déplacement du robot joueur.
   *
   * Cette boucle met uniquement à jour animationPlayerProgress (0 → 1)
   * pendant STEP_DURATION ms, puis s'arrête.
   * C'est la boucle bots qui lit cette valeur et dessine le joueur.
   * Il ne peut donc jamais être rendu deux fois par frame.
   */
  public startAnimationForPlayers(
    ctx: CanvasRenderingContext2D,
    playerName: string
  ): CanvasRenderingContext2D {
    console.log('AnimationFactoryService - startAnimationForPlayers()');
    this.ctx = ctx;

    if (this.robotSignals.size <= 0) return this.ctx;

    // Mise à jour du modèle (déplacement + cellules visitées)
    this.robotActionAspiromanService.moveRobot(playerName);
    this.robotActionAspiromanService.updateRobotsVisitedCells();

    // Guard : un step joueur est déjà en cours, on ignore l'input
    if (this.isPlayerRunning) return this.ctx;
    this.isPlayerRunning = true;

    this.lastPlayerStepTime = performance.now();

    // Réinitialise la progression du joueur à 0 pour ce nouveau step
    this.robotDataFactoryService.animationPlayerProgress.set(0);

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastPlayerStepTime;

      if (deltaTime >= this.STEP_DURATION) {
        // Step terminé : on fixe la progression à 1 (position finale exacte)
        this.robotDataFactoryService.animationPlayerProgress.set(1);
        // Si la boucle bots est active, elle dessine cette dernière frame.
        // Sinon on la dessine ici avant de s'arrêter.
        if (!this.isRunning) {
          this.drawPlayerFrame();
        }
        this.stopPlayerAnimation();
        return;
      }

      // Met à jour la progression (0 → 1)
      this.robotDataFactoryService.animationPlayerProgress.set(
        deltaTime / this.STEP_DURATION
      );

      // Si la boucle bots est inactive (pas de robots IA), on dessine
      // le joueur nous-mêmes — sinon la boucle bots s'en charge.
      if (!this.isRunning) {
        this.drawPlayerFrame();
      }

      this.playerAnimationFrameId = requestAnimationFrame(animate);
    };

    this.playerAnimationFrameId = requestAnimationFrame(animate);
    return this.ctx;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Rendu complet (bots + joueur) — appelable depuis l'extérieur si besoin
  // ────────────────────────────────────────────────────────────────────────────

  public renderAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    this.ctx = ctx;
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

    this.renderAnimationServicesTab.forEach(service => {
      this.ctx = service.drawObject(this.ctx);
    });

    // Le joueur est toujours dessiné en dernier (par-dessus les bots)
    this.ctx = this.robotAspiromanRenderAnimationService.drawObject(this.ctx, false);

    return this.ctx;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Pause depuis l'UI
  // ────────────────────────────────────────────────────────────────────────────

  public onRobotsPause(ctx: CanvasRenderingContext2D): void {
    console.log('AnimationFactoryService - onRobotsPause()');
    this.ctx = ctx;
    // La boucle bots s'arrêtera proprement à la fin du step en cours
    this.isRunning = false;
    // La boucle joueur peut finir son step ; elle s'arrêtera d'elle-même
    console.log('Service de robots mis en pause');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Utilitaires privés
  // ────────────────────────────────────────────────────────────────────────────

  private calculateAndUpdateBots(): void {
    this.actionServicesTab.forEach(actionService => {
      if (actionService.serviceName === 'RobotActionAspiratorService') {
        actionService.calculateNewDirectionsForAllRobots();
        actionService.updateRobotsVisitedCells();
      }
    });
  }

  private drawPlayerFrame(): void {
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

    this.renderAnimationServicesTab.forEach(service => {
      this.ctx = service.drawObject(this.ctx);
    });

    this.ctx = this.robotAspiromanRenderAnimationService.drawObject(this.ctx, false);
  }

  private stopBotsAnimation(): void {
    console.log('AnimationFactoryService - stopBotsAnimation()');
    this.isRunning = false;
    if (this.botsAnimationFrameId !== undefined) {
      cancelAnimationFrame(this.botsAnimationFrameId);
      this.botsAnimationFrameId = undefined;
    }
  }

  private stopPlayerAnimation(): void {
    console.log('AnimationFactoryService - stopPlayerAnimation()');
    this.isPlayerRunning = false;
    if (this.playerAnimationFrameId !== undefined) {
      cancelAnimationFrame(this.playerAnimationFrameId);
      this.playerAnimationFrameId = undefined;
    }
  }
}
