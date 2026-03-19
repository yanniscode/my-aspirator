import { Injectable } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model';
import { PixelPosition } from '../../../classes/models/pixel-position';

@Injectable({
  providedIn: 'root',
})
export abstract class AnimationService {

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

  /**
   * Mise en pause automatique (sans clic) de l'animation (par exemple: en fin de parcours pour tous les robots, s'ils sont inactifs)
   */
  protected abstract pauseAllAnimation(): void;

  /**
   * Dessine le label du robot à afficher autour de celui-ci sur le canvas (ex: nom, niveau de batterie)
   *
   * @param robot
   * @param x
   * @param y
   */
  protected abstract drawRobotLabels(robot: RobotModel, x: number, y: number): void;

  /**
   * Dessine tous les robots de la classe spécifiée (ex: "aspirator") sur le canvas
   */
  public abstract drawRobots(ctx: CanvasRenderingContext2D): void;

  /**
   * Calcul de la coordonnée de déplacement en pixels (x, y) pour la trame suivante
   *
   * @param name
   */
  protected abstract updateCurrentCoordinates(name: string): PixelPosition;
}
