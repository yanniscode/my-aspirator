import { Injectable } from '@angular/core';
import { AssetService } from '../../../main-services/graphics-services/asset-service/asset.service';

@Injectable({
  providedIn: 'root',
})
export class AssetMaisonService extends AssetService {

  constructor() {
    console.log("AssetMaisonService - constructor()");
    super();

    this.ASSETS = [
      { name: 'robot', path: '/assets/megaman.png' },
      { name: 'mur', path: '/assets/texture-mur.png' },
      { name: 'base', path: '/assets/texture-base.png' },
      { name: 'visitee', path: '/assets/texture-visitee.png' },
      { name: 'nonVisitee', path: '/assets/texture-non-visitee.png' },
    ];
  }

  /**
   *
   * @param type
   * @returns
   */
  public override getImageForCell(type: string): HTMLImageElement | undefined {
    // console.log("AssetMaisonService - getImageForCell()");

    switch (type) {
      case 'O': return this.getImage('nonVisitee');
      case 'X': return this.getImage('mur');
      case 'B': return this.getImage('base');
      case '_': return this.getImage('visitee');
      default: return undefined;
    }
  }
}
