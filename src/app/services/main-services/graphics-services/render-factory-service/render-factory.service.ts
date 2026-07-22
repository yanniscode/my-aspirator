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
    private robotAspiromanRenderAnimationService = inject(RobotAspiromanRenderAnimationService);

    /**
     * Pattern factory: tableau général de Render Animation Services de leur type spécifique vers un type générique
     */
    private renderAllAnimationServicesTab: RenderAnimationService[] =
        [this.maisonRenderAnimationService, this.robotAspiratorRenderAnimationService, this.robotAspiromanRenderAnimationService];

    /**
     * Getter: Liste générale des services de rendu visuel (render)
     *
     * @returns
     */
    public getAllRenderAnimationServicesTab(): RenderAnimationService[] {
        return this.renderAllAnimationServicesTab;
    }
}
