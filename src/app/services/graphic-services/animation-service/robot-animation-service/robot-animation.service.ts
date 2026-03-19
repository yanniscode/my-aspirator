import { inject, Injectable, OnDestroy, signal, WritableSignal, computed } from '@angular/core';
import { AnimationService } from '../animation.service';
import { RobotModel } from '../../../../classes/models/robot-model';
import { RobotDataService } from '../../../data-services/robot-data-services/robot-data.service';
import { RobotActionAspiratorService } from "../../../action-services/robot-action-services/robot-action-aspirator-service/robot-action-aspirator.service";
import { CoreAnimationService } from '../core-animation-service/core-animation.service';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotAnimationService extends AnimationService implements OnDestroy {

  private robotDataService = inject(RobotDataService);
  public robotActionAspiratorService = inject(RobotActionAspiratorService);
  private coreAnimationService = inject(CoreAnimationService);

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

  // Signal pour le progress (0 à 1)
  protected animationProgress = signal(0);

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
  public ngOnDestroy(): void {
    console.log("MainAnimationService - ngOnDestroy()");

    this.stopAllAnimation();
    console.log('Service de robots arrêté');
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

  private stopAllAnimation(): void {
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

  // TODO: supprimer ?
  public abstract override drawRobots(ctx: CanvasRenderingContext2D): void;

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
  * Méthode principale de déclenchement de l'animation de la Map de robots
  *
  * @returns void
  */
  public startRobotsAnimation(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
    console.log("RobotAnimationService - startRobotsAnimation()");
    this.ctx = ctx;

    if (this._robotSignals.size <= 0) return this.ctx;

    // on ne démarre ici que si l'animation n'est pas encore activée
    if (this.isRunning) return this.ctx;
    this.isRunning = true;

    let lastStepTime = performance.now();
    let progress = 0;

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
        // 2. Reset du progress à 0
        this.animationProgress.set(0);

        // 3. Calcul des nouvelles directions (qui lit progress = 0)
        // TODO: revoir avec factory pour un appel générique ici (méthode spécifique aux robots aspirateurs, actuellement)
        this.robotActionAspiratorService.calculateNewDirectionsForAllRobots();
        this.robotActionAspiratorService.updateRobotsVisitedCells();
      } else {
        // En cours d'animation
        progress = deltaTime / this.STEP_DURATION;
        // Mettre à jour le signal de progression
        this.animationProgress.set(progress);
      }

      // 4. Mise à jour de la position du robot (vue)
      this.ctx = this.coreAnimationService.renderAnimation(this.ctx, progress);
      this.animationFrameId = requestAnimationFrame(animate);

      return this.ctx;
    };

    this.robotActionAspiratorService.calculateNewDirectionsForAllRobots();
    this.robotActionAspiratorService.updateRobotsVisitedCells();

    // Mise à jour de la position du robot (vue)
    this.ctx = this.coreAnimationService.renderAnimation(this.ctx, progress);
    this.animationFrameId = requestAnimationFrame(animate);

    return this.ctx;
  }
}
