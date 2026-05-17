import { Injectable } from '@angular/core';
import { RobotAspiratorModel } from '../../../../classes/models/robot-model/robot-aspirator-model/robot-aspirator-model';

@Injectable({
  providedIn: 'root',
})
export abstract class RenderAnimationService {

  /**
   * Méthode générique de dessin d'objet sur le Canvas (ex: Maison, Robot...)
   *
   * @param ctx
   */
  public abstract drawObject(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D;

  /**
   * sélectionne la trame d'animation (image) selon la trame d'animation en cours (progress)
   *
   * @param robot
   * @returns
   */
  protected abstract getRobotCtxFrame(robot: RobotAspiratorModel): HTMLImageElement | undefined;

  /**
   * Dessine un label près du robot (ex: nom, niveau de batterie...)
   *
   * @param robot
   * @param x
   * @param y
   * @returns
   */
  protected abstract drawRobotLabels(robot: RobotAspiratorModel, x: number, y: number): void;
}
