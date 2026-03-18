import { inject, Injectable, OnDestroy, WritableSignal, computed } from '@angular/core';
import { RobotModel } from '../../../../classes/models/robot-model';
import { AnimationService } from '../../../graphics-services/animation-service/animation.service';
import { MainRenderAnimationService } from '../../../graphics-services/render-animation-services/main-render-animation-service/main-render-animation.service';
import { RobotActionAspiratorService } from '../../robot-action-services/robot-action-aspirator-service/robot-action-aspirator.service';
import { RobotActionService } from '../../robot-action-services/robot-action.service';
import { RobotDataService } from '../../robot-data-services/robot-data.service';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotAnimationService extends AnimationService implements OnDestroy {

  private robotDataService = inject(RobotDataService);
  private mainRenderAnimationService = inject(MainRenderAnimationService);
  // Pattern factory: on injecte le service robot spécifique (ex: "aspirator") en tant que service robot générique...
  private robotActionAspiratorService = inject(RobotActionAspiratorService) as RobotActionService;
  // ...ce qui permet de passer un tableau de robots générique, avec des caractéristiques spécifiques:
  private robotActionServiceTab: RobotActionService[] = [this.robotActionAspiratorService];

  protected ctx!: CanvasRenderingContext2D;

  /* Variables des robots: */
  protected readonly _robotSignals: Map<string, WritableSignal<RobotModel>>
    = this.robotDataService.robotSignals;

  // computed vérifiant si la map de robots un un robot "aspirator" est à l'état démarré
  public readonly hasActiveRobots = computed(() =>
    [...this._robotSignals.values()].some(signal => signal()?.robotType === "aspirator" && signal()?.isRobotStarted)
  );

  /* Variables pour la Vue: */

  // Variable vérifiant si l'animation est en cours
  protected isRunning = false;

  // Animation des robots: id de la trame en cours
  protected animationFrameId?: number;

  // Configuration de l'animation
  protected readonly STEP_DURATION = 600; // Durée d'un déplacement complet (ms)

  constructor() {
    super();
  }

  /**
   * Nettoyage complet du service
   */
  ngOnDestroy(): void {
    console.log("RobotAnimationService - ngOnDestroy()");

    this.stopAllAnimation();
    console.log('Service de robots arrêté');
  }

  /**
   *
   */
  protected stopAllAnimation(): void {
    console.log("MainAnimationService - stopAllAnimation()");

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
   * 
   */
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

  /**
   * Nettoyage complet du service (animation où tous les robots s'arrêtent)
   */
  public onRobotsPause(ctx: CanvasRenderingContext2D): void {
    console.log("RobotAnimationService - onRobotsPause()");
    this.ctx = ctx;

    this.isRunning = false;
    console.log('Service de robots mis en pause');
  }

  /**
  * Méthode principale de déclenchement de l'animation de la Map de robots
  *
  * @returns void
  */
  public startAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("RobotAnimationService - startAnimation()");
    this.ctx = ctx;

    if (this._robotSignals.size <= 0) return this.ctx;

    // on ne démarre ici que si l'animation n'est pas encore activée
    if (this.isRunning) return this.ctx;
    this.isRunning = true;

    let lastStepTime = performance.now();
    let progress = 0;
    this.robotDataService.animationProgress.set(progress);

    const animate = (currentTime: number) => {

      const deltaTime = currentTime - lastStepTime;

      const sequenceEnded = deltaTime >= this.STEP_DURATION;

      // on termine la séquence actuelle avant de mettre en pause l'animation
      if (!this.isRunning && sequenceEnded) {
        this.pauseAllAnimation();
        return this.ctx;
      }
      // Nouvelle direction selon la durée de STEP_DURATION
      else if (sequenceEnded) {
        // s'il n'y a plus de robot actif à la fin de la séquence d'animation, on stoppe directement l'animation
        if (!this.hasActiveRobots()) {
          this.pauseAllAnimation();
          return this.ctx;
        }

        // 1. Reset du temps
        lastStepTime = currentTime;

        // 2. Calcul des nouvelles directions (qui lit progress = 0)

        // On appelle les méthodes d'action de chaque service de robot spécifique, à partir du type générique de service robot
        for (let i = 0; i < this.robotActionServiceTab.length; i++) {
          this.robotActionServiceTab[i].calculateNewDirectionsForAllRobots();
          this.robotActionServiceTab[i].updateRobotsVisitedCells();
        }

      } else {
        // En cours d'animation
        progress = deltaTime / this.STEP_DURATION;
        // Mettre à jour le signal de progression
        this.robotDataService.animationProgress.set(progress);
      }

      // 3. Mise à jour de la position du robot (vue)
      this.ctx = this.mainRenderAnimationService.renderAnimation(this.ctx);
      this.animationFrameId = requestAnimationFrame(animate);

      return this.ctx;
    };

    // on appelle les méthodes d'action de chaque service de robot spécifique, à partir du type de service robot générique
    for (let i = 0; i < this.robotActionServiceTab.length; i++) {
      this.robotActionServiceTab[i].calculateNewDirectionsForAllRobots();
      this.robotActionServiceTab[i].updateRobotsVisitedCells();
    }

    // Mise à jour de la position du robot (vue)
    this.ctx = this.mainRenderAnimationService.renderAnimation(this.ctx);
    this.animationFrameId = requestAnimationFrame(animate);

    return this.ctx;
  }
}
