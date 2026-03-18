import { Injectable } from '@angular/core';
import { AnimationService } from '../animation.service';

@Injectable({
  providedIn: 'root',
})
export abstract class MaisonAnimationService extends AnimationService {

  constructor() {
    super();
  }
}
