import { inject, Injectable, OnDestroy, WritableSignal } from '@angular/core';
import { AnimationService } from '../../../main-services/graphics-services/animation-service/animation.service';
import { RobotAspiratorDataService } from '../../robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { RobotAspiratorModel } from '../../../../classes/models/robot-model/robot-aspirator-model/robot-aspirator-model';

@Injectable({
  providedIn: 'root',
})
export abstract class RobotAspiratorAnimationService extends AnimationService implements OnDestroy {

  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  protected ctx!: CanvasRenderingContext2D;

  /* Variables des robots: */
  protected readonly robotAspiratorSignals: Map<string, WritableSignal<RobotAspiratorModel>>
    = this.robotAspiratorDataService.robotAspiratorSignals;

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
    console.log("RobotAspiratorAnimationService - ngOnDestroy()");

    this.stopAllAnimation();
    console.log('Service de robots arrêté');
  }

  /**
   *
   */
  protected stopAllAnimation(): void {
    console.log("RobotAspiratorAnimationService - stopAllAnimation()");

    console.log('Animation stopped');
    this.isRunning = false;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    // On vide la map de signaux (réinitialisation complète des robots)
    this.robotAspiratorSignals.clear();
  }

  /**
   *
   */
  protected pauseAllAnimation(): void {
    console.log("RobotAspiratorAnimationService - pauseAllAnimation()");

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
