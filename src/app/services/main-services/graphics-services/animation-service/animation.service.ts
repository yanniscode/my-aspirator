import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export abstract class AnimationService {

  /**
   * Fin de toute animation, notamment au ngOnDestroy():
   * Nettoyage complet du service
   */
  protected abstract stopAllAnimation(): void;
}
