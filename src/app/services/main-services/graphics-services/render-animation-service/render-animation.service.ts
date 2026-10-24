import { inject, Injectable } from '@angular/core';
import { AbstractModel } from '../../../../classes/models/abstract-model';
import { RobotStateItem } from '../../../../data-access/robot-data-access/robot.model';
import { RobotStore } from '../../../../data-stores/robot.signal-store';

@Injectable({
  providedIn: 'root',
})
export abstract class RenderAnimationService<T extends AbstractModel = AbstractModel> {

  protected robotStore = inject(RobotStore);
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
  protected abstract getRobotCtxFrame(robot: RobotStateItem): HTMLImageElement | undefined;

  /**
   * Dessine un label près du robot (ex: nom, niveau de batterie...)
   *
   * @param robot
   * @param x
   * @param y
   * @returns
   */
  protected abstract drawRobotLabels(robot: RobotStateItem, x: number, y: number): void;
}
