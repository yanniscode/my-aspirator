import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { TableModule } from "primeng/table";
import { LoggerService } from '../../services/data-services/logger-service/logger.service';
import { RobotAspiratorAnimationService } from '../../services/graphic-services/animation-service/robot-aspirator-animation-service/robot-aspirator-animation.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [TableModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  // TODO: remplacer animation d'intro
  // animations: [
  // TODO: supprimer car obsolète
  //   trigger('maisonAnimation', [
  //     transition(':enter', [
  //       style({ opacity: 0 }),
  //       animate('1500ms ease-out', style({ opacity: 1 }))
  //     ])
  //   ]),
  // ]
})
export class GameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;

  private robotAspiratorAnimationService = inject(RobotAspiratorAnimationService);
  private loggerService = inject(LoggerService);

  constructor() {
    console.log("GameComponent - constructor()");
  }

  /**
   * initialise le canvas après la vue
   */
  async ngAfterViewInit(): Promise<void> {
    console.log("GameComponent - ngAfterViewInit()");

    await this.robotAspiratorAnimationService.initialiseAfterView(this.gameCanvas);
  }

  /**
  * Nettoyage complet du service
  */
  public ngOnDestroy(): void {
    console.log("GameComponent - ngOnDestroy()");

    this.robotAspiratorAnimationService.ngOnDestroy();
    console.log('Service de robots arrêté');
  }

  private log(message: string): void {
    this.loggerService.add(`GameComponent: ${message}`);
  }
}
