import { Injectable } from '@angular/core';
import { AnimationService } from '../../../main-services/graphics-services/animation-service/animation.service';

@Injectable({
  providedIn: 'root',
})
export abstract class MaisonAnimationService extends AnimationService {

  /* TODO : garder même si non utilisée actuellement */
  constructor() {
    super();
  }
}
