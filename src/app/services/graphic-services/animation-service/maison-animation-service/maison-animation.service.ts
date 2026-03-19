import { inject, Injectable } from '@angular/core';
import { AnimationService } from '../animation.service';
import { AssetMaisonService } from '../../asset-service/asset-maison-service/asset-maison.service';

@Injectable({
  providedIn: 'root',
})
export abstract class MaisonAnimationService extends AnimationService {

  private assetMaisonService = inject(AssetMaisonService);

  constructor() {
    super();
  }

  /**
   * Chargement des images pour le canvas
   */
  protected async loadCanvasImages(): Promise<void> {
    console.log("MaisonAnimationService - loadCanvasImages()");

    await this.assetMaisonService.loadAssets();
  }
}
