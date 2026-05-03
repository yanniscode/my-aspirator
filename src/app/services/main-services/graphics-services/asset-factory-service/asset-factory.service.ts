import { inject, Injectable } from '@angular/core';
import { AssetService } from '../asset-service/asset.service';
import { AssetMaisonService } from '../../../maison-services/maison-graphics-services/asset-maison-service/asset-maison.service';
import { AssetRobotService } from '../../../robot-services/robot-graphics-services/asset-robot-service/asset-robot.service';

@Injectable({
  providedIn: 'root',
})
export class AssetFactoryService {

  private assetMaisonService = inject(AssetMaisonService) as AssetService;
  private assetRobotService = inject(AssetRobotService) as AssetService;
  private assetServicesTab: AssetService[] = [this.assetMaisonService, this.assetRobotService];

  /**
   * Liste de services de gestion des images pour l'animation (personnages...)
   *
   * @returns
   */
  public getAssetServicesTab(): AssetService[] {
    return this.assetServicesTab;
  }
}
