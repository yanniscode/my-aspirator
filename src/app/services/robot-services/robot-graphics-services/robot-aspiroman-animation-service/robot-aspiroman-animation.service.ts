import { inject, Injectable, OnDestroy, WritableSignal } from '@angular/core';
import { RobotAspiromanDataService } from '../../robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';
import { AnimationService } from '../../../main-services/graphics-services/animation-service/animation.service';
import { AspiromanModel } from '../../../../classes/models/robot-model/aspiroman-model/aspiroman-model';

@Injectable({
  providedIn: 'root',
})
export class RobotAspiromanAnimationService extends AnimationService implements OnDestroy {

  private robotAspiromanDataService = inject(RobotAspiromanDataService);


  protected ctx!: CanvasRenderingContext2D;

  /* Variables des robots: */
  protected readonly _robotSignals: Map<string, WritableSignal<AspiromanModel>>
    = this.robotAspiromanDataService.aspiromanSignals;

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
    console.log("RobotAspiromanAnimationService - ngOnDestroy()");

    this.stopAllAnimation();
    console.log('Service de robots arrêté');
  }

  /**
   *
   */
  protected override stopAllAnimation(): void {
    console.log("RobotAspiromanAnimationService - stopAllAnimation()");

    console.log('Animation stopped');
    this.isRunning = false;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    // On vide la map de signaux (réinitialisation complète des robots)
    this._robotSignals.clear();
  }
}
