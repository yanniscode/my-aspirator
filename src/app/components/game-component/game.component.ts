import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { TableModule } from "primeng/table";
import { LoggerService } from '../../services/main-services/logger-service/logger.service';
import { MaisonDataNettoyageService } from '../../services/maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { AnimationFactoryService } from '../../services/main-services/graphics-services/animation-factory-service/animation-factory.service';

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
export class GameComponent implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  private animationFactoryService = inject(AnimationFactoryService);

  private loggerService = inject(LoggerService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px

  constructor() {
    console.log("GameComponent - constructor()");
  }

  /**
 * initialise le canvas après la vue
 */
  async ngAfterViewInit(): Promise<void> {
    console.log("GameComponent - ngAfterViewInit()");

    await this.initialiseAfterView(this.gameCanvas);
  }

  public onStart() {
    console.log("GameComponent - onStart()");

    this.ctx = this.animationFactoryService.declencheAnimationService(this.ctx);
  }

  public onPause(): void {
    console.log("GameComponent - onPause");

    this.animationFactoryService.pauseAnimationService(this.ctx);
  }

  public async initialiseAfterView(gameCanvas: ElementRef<HTMLCanvasElement>): Promise<void> {
    console.log("GameComponent - ngAfterViewInit()");

    const maison = this.maisonDataNettoyageService.maisonSignal();
    // adaptation de la taille du canvas à la maison (représente tout l'environnement)
    const canvas = gameCanvas.nativeElement;
    canvas.width = maison.maison[0].length * this.CELL_SIZE;
    canvas.height = maison.maison.length * this.CELL_SIZE;

    // Fix Firefox
    // on doit assigner la valeur du ctx pour le Canvas
    this.ctx = this.animationFactoryService.initCanvasContext(canvas);

    // Attente du chargement des images (maison) avant le rendu
    await this.animationFactoryService.loadCanvasImages();

    this.ctx = this.animationFactoryService.renderAnimation(this.ctx);
  }

  private log(message: string): void {
    this.loggerService.add(`GameComponent: ${message}`);
  }
}
