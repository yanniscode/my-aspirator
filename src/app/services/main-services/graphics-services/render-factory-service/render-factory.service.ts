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
     * Pattern factory: tableau de Render Animation Services pour les objets statiques comme les éléments de décor (Maison...)
     * de leur type spécifique vers un type générique
     * (chargement des services de rendu sur le Canvas)
     */
    private renderObjectsAnimationServicesTab: RenderAnimationService[] =
        [this.maisonRenderAnimationService];

    /**
     *
     * Pattern factory: tableau de Render Animation Services pour les Bots, de leur type spécifique vers un type générique
     * (chargement des services de rendu sur le Canvas)
     */
    private renderBotsAnimationServicesTab: RenderAnimationService[] =
        [this.robotAspiratorRenderAnimationService];

    /**
     * Pattern factory: tableau de Render Animation Services pour les Joueurs, de leur type spécifique vers un type générique
     * (chargement des services de rendu sur le Canvas)
     */
    private renderPlayersAnimationServicesTab: RobotAspiromanRenderAnimationService[] =
        [this.robotAspiromanRenderAnimationService];

    /**
     * Getter: Liste de services de rendu visuel pour les Objets statiques comme les éléments de décor (Maison...)
     *
     * @returns
     */
    public getObjectsRenderAnimationServicesTab(): RenderAnimationService[] {
        return this.renderObjectsAnimationServicesTab;
    }

    /**
     * Getter: Liste de services de rendu visuel pour les Bots
     *
     * @returns
     */
    public getBotsRenderAnimationServicesTab(): RenderAnimationService[] {
        return this.renderBotsAnimationServicesTab;
    }

    /**
     * Getter: Liste de services de rendu visuel pour les robots Joueurs
     *
     * @returns
     */
    public getPlayersRenderAnimationServicesTab(): RobotAspiromanRenderAnimationService[] {
        return this.renderPlayersAnimationServicesTab;
    }
}
