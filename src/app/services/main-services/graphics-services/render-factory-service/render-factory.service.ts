import { inject, Injectable } from '@angular/core';
import { MaisonRenderAnimationService } from '../../../maison-services/maison-graphics-services/maison-render-animation-service/maison-render-animation.service';
import { RobotAspiratorRenderAnimationService } from '../../../robot-services/robot-graphics-services/robot-aspirator-render-animation-service/robot-aspirator-render-animation.service';
import { RenderAnimationService } from '../render-animation-service/render-animation.service';
import { RobotAspiromanRenderAnimationService } from '../../../robot-services/robot-graphics-services/robot-aspiroman-render-animation-service/robot-aspiroman-render-animation.service';

@Injectable({
    providedIn: 'root',
})
export class RenderFactoryService {

    private maisonRenderAnimationService = inject(MaisonRenderAnimationService) as RenderAnimationService;
    private robotAspiratorRenderAnimationService = inject(RobotAspiratorRenderAnimationService) as RenderAnimationService;

    // Pattern factory: tableau de Render Animation Services de type spécifiques vers un type générique (chargement des services de rendu sur le Canvas)
    private renderAnimationServicesTab: RenderAnimationService[] =
        [this.maisonRenderAnimationService, this.robotAspiratorRenderAnimationService];

    /**
     * Liste de services de rendu visuel
     *
     * @returns
     */
    public getRenderAnimationServicesTab(): RenderAnimationService[] {
        return this.renderAnimationServicesTab;
    }
}
