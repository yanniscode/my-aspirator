import { effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { AssetService } from '../asset-service/asset.service';

import { RenderAnimationService } from '../render-animation-service/render-animation.service';
import { RobotActionService } from '../../../robot-services/robot-action-services/robot-action.service';
import { RenderFactoryService } from '../render-factory-service/render-factory.service';
import { ActionFactoryService } from '../action-factory-service/action-factory.service';
import { AssetFactoryService } from '../asset-factory-service/asset-factory.service';
import { RobotDataFactoryService } from '../../../robot-services/robot-data-factory-service/robot-data-factory.service';
import { RobotDataService } from '../../../robot-services/robot-data-services/robot-data.service';
import { RobotStore } from '../../../../data-stores/robot.signal-store';
import { isAspiroman } from '../../../../data-access/robot-data-access/robot.model';

@Injectable({
  providedIn: 'root',
})
export class AnimationFactoryService {

  // ─── Services injectés ──────────────────────────────────────────────────────

  private robotDataFactoryService = inject(RobotDataFactoryService);
  private robotDataFactoryServicesTab: RobotDataService[] = this.robotDataFactoryService.getDataServicesTab();

  private assetFactoryService = inject(AssetFactoryService);
  private assetServicesTab: AssetService[] = this.assetFactoryService.getAssetServicesTab();

  private actionFactoryService = inject(ActionFactoryService);
  private actionServicesTab: RobotActionService[] = this.actionFactoryService.getActionServicesTab();

  private renderFactoryService = inject(RenderFactoryService);

  private renderAllAnimationServicesTab: RenderAnimationService[] = this.renderFactoryService.getAllRenderAnimationServicesTab();

  private robotStore = inject(RobotStore);

  // ─── Canvas ─────────────────────────────────────────────────────────────────

  protected ctx!: CanvasRenderingContext2D;

  private readonly ROW_COLOR = 'rgb(0, 140, 133)';
  private readonly WIDTH = 500;
  private readonly HEIGHT = 400;

  // ─── Configuration ──────────────────────────────────────────────────────────

  /** Durée d'un déplacement complet en ms */
  protected readonly BOTS_STEP_DURATION = 600;
  protected readonly PLAYERS_STEP_DURATION = 600;
  protected readonly DEATH_ANIM_DURATION = 600;

  // État du jeu (start / pause)
  private isGameStarted = false;

  // ─── État boucle bots (maîtresse du canvas) ──────────────────────────────────
  protected areBotsRunning = false;
  private botsAnimationFrameId?: number;
  private lastBotsStepTime = 0;
  private botsProgress = 0;

  // ─── État de la boucle Joueur (modèle uniquement, pas de rendu) ────────────────────
  //
  // La boucle joueur NE DESSINE PAS. Elle met uniquement à jour
  // animationPlayerProgress (0 → 1) sur la durée d'un PLAYERS_STEP_DURATION.
  // La boucle bots lit ce signal à chaque frame et dessine le joueur.
  // Cela garantit qu'il n'est dessiné qu'une seule fois par frame,
  // quelle que soit l'activité de la boucle joueur.
  public readonly _isPlayerRunningSignals: Map<string, WritableSignal<boolean>> = new Map<string, WritableSignal<boolean>>();
  private readonly _playerLastStepTimeSignals: Map<string, WritableSignal<number>> = new Map<string, WritableSignal<number>>();
  private readonly _playerAnimationFrameId: Map<string, WritableSignal<number | undefined>> = new Map<string, WritableSignal<number | undefined>>();

  // ── champs du service ──────────────────────────────────────
  private readonly deathAnimatedIds = new Set<string>();   // ✅ one-shot par élimination

  // dans le constructeur du service (injectable)
  constructor() {
    console.log("AnimationFactoryService - constructor()");

    effect(() => {
      console.log("effect !");

      const eliminatedNow = this.robotStore.players()
        .filter(p => p.isEliminated)
        .map(p => p.robotId);

      for (const robotId of eliminatedNow) {
        // ✅ ONE-SHOT : seulement si pas déjà traité
        if (this.deathAnimatedIds.has(robotId)) continue;
        this.deathAnimatedIds.add(robotId);

        this.playDeathAnimation(robotId);
      }

      const resurrectedNow = this.robotStore.players()
        .filter(p => !p.isEliminated)
        .map(p => p.robotId);

      for (const robotId of resurrectedNow) {
        // ⚠️ ne nettoyer que si ce joueur était marqué mort (sinon ça tourne pour rien)
        if (this.deathAnimatedIds.has(robotId)) {
          this.onPlayerResurrected(robotId);
        }
      }
    });
  }

  /**
   * Création des paramètres pour l'animation (appelé après l'instanciation des robots dans GameComponent)
   */
  public createRobotPlayersAnimationParams() {
    console.log("AnimationFactoryService - createRobotPlayersAnimationParams");

    this.robotStore.players().forEach(player => {
      if (player.robotType === "player") {
        this._isPlayerRunningSignals.set(player.robotId, signal(false));
        this._playerLastStepTimeSignals.set(player.robotId, signal(0));
        this._playerAnimationFrameId.set(player.robotId, signal(0));
      }
    });
  }

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
    await Promise.all(
      this.assetServicesTab.map(assetService => assetService.loadAssets()) // parallèle
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Point d'entrée principal
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Démarrage du Jeu
   */
  public onStart(): void {
    console.log("GameComponent - onStart()");
    this.isGameStarted = true;
    // on démarre les bots à l'animation coordonnée (IAs)
    this.startBotsAnimation(this.ctx);
  }

  /**
   * Mise en pause du Jeu
   */
  public onPause(): void {
    console.log("GameComponent - onPause");
    this.isGameStarted = false;
    this.onRobotsPause(this.ctx);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Boucle maîtresse du canvas
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * Démarrage de l'animation générale (Bots, Joueurs, Maison...)
   *
   * @param ctx
   * @returns ctx
   */
  public startBotsAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log('AnimationFactoryService - startBotsAnimation()');

    const aspirator = this.robotStore?.aspirators();
    if (aspirator.length === 0) return ctx;

    this.areBotsRunning = true;

    this.lastBotsStepTime = performance.now();
    this.botsProgress = 0;

    this.calculateAndUpdateBots();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastBotsStepTime;
      const sequenceEnded = deltaTime >= this.BOTS_STEP_DURATION;

      // Pause demandée depuis l'UI : on attend la fin du step en cours
      if (!this.areBotsRunning && sequenceEnded) {
        console.log('AnimationFactoryService - bots : pause, fin de step');
        this.stopBotsAnimation();

        this.botsProgress = deltaTime / this.BOTS_STEP_DURATION;
        return;
      }

      if (sequenceEnded) {
        if (!this.robotStore.hasActiveRobots()) {
          console.log('AnimationFactoryService - bots : plus de robots actifs, arrêt');
          this.stopBotsAnimation();
          return;
        }
        // Nouvelle séquence
        this.lastBotsStepTime = currentTime;
        this.botsProgress = 0;
        this.calculateAndUpdateBots();
      } else {
        this.botsProgress = deltaTime / this.BOTS_STEP_DURATION;
        this.robotDataFactoryService.animationBotsProgSignal.set(this.botsProgress);
      }

      // ── Rendu unique par frame ──────────────────────────────────────────────
      // 1. Tous les objets de décor (Maison)
      // 2. Tous les bots IA
      // 3. Le joueur — TOUJOURS dessiné ici, jamais ailleurs.

      // Rendu générique de tous les éléments (Maison, bots, joueurs...)
      this.renderAnimation(ctx);

      this.botsAnimationFrameId = requestAnimationFrame(animate);
    };

    this.botsAnimationFrameId = requestAnimationFrame(animate);
    return ctx;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Boucle joueur — modèle uniquement, AUCUN dessin
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Déclenche un déplacement du robot joueur.
   *
   * @param robotId
   */
  public onPlayerAction(robotId: string): void {
    if (this.isGameStarted) {
      this.startAnimationForPlayer(this.ctx, robotId);
    } else {
      console.log("Partie en pause !");
    }
  }

  private playDeathAnimation(robotId: string): void {
    // Le joueur a-t-il un step de déplacement en vol ?
    const isRunning = this._isPlayerRunningSignals.get(robotId)?.() ?? false;

    if (isRunning) {
      // ⏳ Laisser l'animation du mouvement se terminer jusqu'à la position de collision,
      // puis déclencher la mort.
      const lastStepTime = this._playerLastStepTimeSignals.get(robotId)?.() ?? performance.now();
      const remaining = Math.max(0, this.PLAYERS_STEP_DURATION - (performance.now() - lastStepTime));

      setTimeout(() => this.startDeathAnimation(robotId), remaining);
      return;
    }
    this.startDeathAnimation(robotId);
  }

  private startDeathAnimation(robotId: string): void {
    // 🛟 Garde : le joueur a pu ressusciter pendant l'attente
    const player = this.robotStore.playerById(robotId);
    if (!player || !isAspiroman(player) || !player.isEliminated) return;

    this.stopPlayerAnimation(robotId);
    // moveProg = 1 (déjà fait par la fin du step si le joueur bougeait — idempotent)
    this.robotDataFactoryService.animationPlayerProgSignals.get(robotId)?.set(1);

    const deathProg = this.robotDataFactoryService.animationPlayerDeathProgSignals.get(robotId);
    if (!deathProg || !this.ctx) return;

    const startTime = performance.now();
    const animateDeath = (currentTime: number) => {
      const raw = (currentTime - startTime) / this.DEATH_ANIM_DURATION; // ✅ clamp [0, 1]
      const progress = Math.min(1, raw);
      deathProg.set(progress);
      if (progress < 1) requestAnimationFrame(animateDeath);
    };
    requestAnimationFrame(animateDeath);
  }

  // — Dans le service d'animation (méthode publique appelée par la résurrection) —
  public onPlayerResurrected(robotId: string): void {
    // 1️⃣ La progression de mort est réinitialisée
    this.robotDataFactoryService.animationPlayerDeathProgSignals.get(robotId)?.set(0);

    // 2️⃣ Le joueur peut rejouer une animation de mort plus tard
    this.deathAnimatedIds.delete(robotId);   // ✅ sinon le one-shot bloquera sa prochaine mort !

    // 3️⃣ Optionnel : remettre le sprite "vivant" proprement
    this.robotDataFactoryService.animationPlayerProgSignals.get(robotId)?.set(0);
  }

  /**
   * Déclenche un déplacement du robot joueur.
   *
   * Cette boucle met uniquement à jour animationPlayerProgress (0 → 1)
   * pendant PLAYERS_STEP_DURATION (ms), puis s'arrête.
   * C'est la boucle bots qui lit cette valeur et dessine le joueur.
   * Il ne peut donc jamais être rendu deux fois par frame.
   */
  public startAnimationForPlayer(
    ctx: CanvasRenderingContext2D,
    robotId: string
  ): void {
    console.log('AnimationFactoryService - startAnimationForPlayers()');

    if (!ctx) return;

    const players = this.robotStore.players();
    if (players.length === 0) return;

    const player = players.find(r => r.robotId === robotId);
    if (!player) return;

    // Mise à jour du modèle (déplacement + cellules visitées)
    this.actionServicesTab.forEach(actionService => {
      if (actionService.serviceName === "RobotActionAspiromanService") {
        // on passe par la factory d'Action des robots "Joueurs" pour déclencher le mouvement
        this.actionFactoryService.triggerRobotPlayerMove(robotId);
      }
    });

    const isPlayerRunning = this._isPlayerRunningSignals.get(robotId);
    if (!isPlayerRunning) return;
    // Guard : un step joueur est déjà en cours, on ignore l'input
    if (isPlayerRunning && isPlayerRunning() === true) return;
    // sinon, on le passe en status "running"
    isPlayerRunning.set(true);

    const playerLastStepTimeSignals = this._playerLastStepTimeSignals.get(robotId);
    if (playerLastStepTimeSignals) {
      playerLastStepTimeSignals.set(performance.now());
    }

    // Réinitialise la progression du joueur à 0 pour ce nouveau step
    const animationPlayerProg = this.robotDataFactoryService.animationPlayerProgSignals.get(robotId);
    if (animationPlayerProg) animationPlayerProg.set(0);

    const animate = (currentTime: number) => {
      let deltaTime = -1;

      const lastPlayerStepTimeSignals = this._playerLastStepTimeSignals.get(robotId);
      if (lastPlayerStepTimeSignals) {
        deltaTime = currentTime - lastPlayerStepTimeSignals();
      }

      if (deltaTime >= this.PLAYERS_STEP_DURATION) {
        // Step terminé : on fixe la progression à 1 (position finale exacte)
        this.robotDataFactoryService.animationPlayerProgSignals.get(robotId)?.set(1);

        // Si la boucle bots est active, elle dessine cette dernière frame.
        // Sinon on la dessine ici avant de s'arrêter.
        if (!this.areBotsRunning) {
          this.renderAnimation(ctx);
        }
        this.stopPlayerAnimation(robotId);
        return;
      }

      // Met à jour la progression (0 → 1)
      const progress = deltaTime / this.PLAYERS_STEP_DURATION;
      const animationPlayerProg = this.robotDataFactoryService.animationPlayerProgSignals.get(robotId);
      if (animationPlayerProg) animationPlayerProg.set(progress);

      // const animationPlayerDeathProg = this.robotDataFactoryService.animationPlayerDeathProgSignals.get(robotId);
      // if (animationPlayerDeathProg) animationPlayerDeathProg.set(progress);

      // Si la boucle bots est inactive (pas de robots IA), on dessine le joueur nous-même,
      // sinon la boucle bots s'en charge.
      if (!this.areBotsRunning) { this.renderAnimation(ctx); }

      const frameSignal = this._playerAnimationFrameId.get(robotId);
      if (frameSignal) {
        frameSignal.set(requestAnimationFrame(animate));
      }
    };

    // Démarrage de l'animation : on set frameId au premier tour
    const firstFrameSignal = this._playerAnimationFrameId.get(robotId);
    if (firstFrameSignal) {
      firstFrameSignal.set(requestAnimationFrame(animate));
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Rendu complet (bots + joueur) — appelable depuis l'extérieur si besoin
  // ────────────────────────────────────────────────────────────────────────────

  public renderAnimation(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

    // Rendu générique de tous les éléments (Maison, bots, joueurs...)
    this.renderAllAnimationServicesTab.forEach(renderObjectsAnimationService => {
      ctx = renderObjectsAnimationService.drawObject(ctx);
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Pause depuis l'UI
  // ────────────────────────────────────────────────────────────────────────────

  public onRobotsPause(ctx: CanvasRenderingContext2D): void {
    // La boucle bots s'arrêtera proprement à la fin du step en cours
    this.areBotsRunning = false;
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
      }
    });
    this.robotDataFactoryServicesTab.forEach(robotDataFactoryService => {
      if (robotDataFactoryService.serviceName === 'RobotAspiratorDataService') {
        robotDataFactoryService.updateRobotsVisitedCells();
      }
    });
  }

  private stopBotsAnimation(): void {
    console.log('AnimationFactoryService - stopBotsAnimation()');
    this.areBotsRunning = false;
    if (this.botsAnimationFrameId !== undefined) {
      cancelAnimationFrame(this.botsAnimationFrameId);
      this.botsAnimationFrameId = undefined;
    }
  }

  private stopPlayerAnimation(robotId: string): void {
    console.log('AnimationFactoryService - stopPlayerAnimation()');

    const isPlayerRunning = this._isPlayerRunningSignals.get(robotId);
    if (!isPlayerRunning) return;
    isPlayerRunning.set(false);

    const playerAnimationFrameId = this._playerAnimationFrameId.get(robotId);
    if (playerAnimationFrameId === undefined) return;
    // on utilise "!" sur playerAnimationFrameId ici :la valeur doit être obligatoirement renseignée
    cancelAnimationFrame(playerAnimationFrameId()!);
    playerAnimationFrameId.set(undefined);
  }
}
