import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export abstract class AnimationService {

  /**
   * Fin de toute animation, notamment au ngOnDestroy():
   * Nettoyage complet du service
   */
  protected abstract stopAllAnimation(): void;

  /**
   * Mise en pause automatique (sans clic) de l'animation (par exemple: en fin de parcours pour tous les robots, s'ils sont inactifs)
   */
  protected abstract pauseAllAnimation(): void;

  /**
 * Méthode liée à la mise en pause au clic de l'animation
 */
  public abstract onRobotsPause(ctx: CanvasRenderingContext2D): void;

  /**
  * Méthode liée au démarrage au clic de l'animation
  *
  * @returns void
  */
  public abstract startRobotsAnimation(ctx: CanvasRenderingContext2D): void;
}
