import { Injectable } from '@angular/core';

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
}
