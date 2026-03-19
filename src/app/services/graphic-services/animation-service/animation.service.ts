import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export abstract class AnimationService {

  /**
  * Méthode principale de déclenchement de l'animation de la Map de robots
  * 
  * @returns void
  */
  public abstract startRobotsAnimation(): void;
}
