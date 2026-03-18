import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject, ViewChild, ElementRef, computed, Signal, signal, OnDestroy, AfterViewInit, WritableSignal } from '@angular/core';
import { TableModule } from "primeng/table";
import { LoggerService } from '../../services/data-services/logger-service/logger.service';
import { MaisonModel } from '../../classes/models/maison-model';
import { GridPosition } from '../../classes/models/grid-position';
import { CellElement } from '../../classes/models/cellElement';
import { PixelPosition } from '../../classes/models/pixel-position';
import { MaisonDataNettoyageService } from '../../services/data-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { RobotDataService } from '../../services/data-services/robot-data-services/robot-data.service';
import { RobotModel } from '../../classes/models/robot-model';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { RobotAspiratorService } from '../../services/action-services/robot-action-services/robot-aspirator-service/robot-aspirator.service';
import { AssetRobotService } from '../../services/graphic-services/asset-service/asset-robot-service/asset-robot.service';
import { AssetMaisonService } from '../../services/graphic-services/asset-service/asset-maison-service/asset-maison.service';

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
  //   // TODO: supprimer car obsolète
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

  private maisonNettoyageService = inject(MaisonDataNettoyageService);
  public robotDataService = inject(RobotDataService);
  public robotAspiratorService = inject(RobotAspiratorService);
  private assetRobotService = inject(AssetRobotService);
  private assetMaisonService = inject(AssetMaisonService);
  private loggerService = inject(LoggerService);

  private ctx!: CanvasRenderingContext2D;

  /* Variables de la maison: */

  // Dimensions de la Maison et des Robots sur canvas
  private readonly WIDTH = 500;
  private readonly HEIGHT = 400;
  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px
  private readonly CELL_PADDING = 8;      // td-maison: padding: 0.5rem (≈ 8px)
  private readonly ROW_COLOR = 'rgb(0, 140, 133)'; // tr-maison: background

  // variables de template binding (@input vers le composant robot):
  public readonly maisonViewModel: Signal<MaisonModel> = computed(() =>
    this.maisonNettoyageService.maisonSignal()
  );

  // Params de la maison (tableau)
  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: GridPosition[] = [];
  static maison: CellElement[][] = [[]];

  /* Variables des robots: */
  public robotNames = signal<string[]>([]);

  // TODO: refacto - faire passer datas à partir du service, et plus du parent:
  private robotNameInput!: string;

  // Injecter le signal une seule fois à l'initialisation
  // Map de robots
  private readonly _robotSignals: Map<string, WritableSignal<RobotModel>>
    = this.robotDataService.robotSignals as Map<string, WritableSignal<RobotModel>>;
  // Signal computed qui expose les valeurs de la Map de robots sous forme de tableau
  public readonly robotList: Signal<RobotModel[]> = computed(() =>
    Array.from(this._robotSignals.values()).map(signal => signal())
  );

  // Robot à l'unité:
  // Computed dédié pour le robot — pas d'effet de bord
  private readonly _robotServiceSignal: Signal<Signal<RobotModel | undefined>> = computed(() =>
    this.robotDataService.getRobotSignal(this.robotNameInput)
  );

  // Computed dédié pour le robot — pas d'effet de bord
  // Un computed() doit être une fonction pure: même entrées → même sortie, sans toucher à l'état extérieur
  public readonly robotViewModel = computed(() => {
    const signal = this._robotServiceSignal();
    return signal ? signal() : undefined;
  });

  public readonly hasActiveRobots = computed(() =>
    [...this._robotSignals.values()].some(signal => signal()?.isRobotStarted)
  );

  // Variables pour la Vue - animation des robots
  private animationFrameId?: number;
  private isRunning = false;

  // Signal pour le progress (0 à 1)
  private animationProgress = signal(0);

  // Configuration de l'animation
  private readonly STEP_DURATION = 600; // Durée d'un déplacement complet (ms)

  constructor() {
    console.log("GameComponent - constructor()");
  }

  /**
   * Fix Firefox — le contexte canvas reste en état "lazy"
   * jusqu'au premier appel de dessin synchrone.
   * On dessine le fond de la maison pour activer le contexte.
   */
  private initCanvasContext(canvas: HTMLCanvasElement): void {
    console.log("GameComponent - initCanvasContext()");

    this.ctx = canvas.getContext('2d')!;
    this.ctx.fillStyle = this.ROW_COLOR;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Chargement des images pour le canvas
   */
  private async loadCanvasImages(): Promise<void> {
    console.log("GameComponent - loadCanvasImages()");

    await this.assetMaisonService.loadAssets();
    await this.assetRobotService.loadAssets();
  }

  /**
   * Affichage des images sur le canvas
   */
  private render(): void {
    // console.log("GameComponent - render()");

    // Efface tout
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    // Dessine tout
    this.drawGrille();
    this.drawRobots();
  }

  async ngAfterViewInit(): Promise<void> {
    console.log("GameComponent - ngAfterViewInit()");

    if (this.isRunning) return;

    const canvas = this.gameCanvas.nativeElement;
    const maison = this.maisonNettoyageService.maisonSignal();
    canvas.width = maison.maison[0].length * this.CELL_SIZE;
    canvas.height = maison.maison.length * this.CELL_SIZE;

    // Fix Firefox
    this.initCanvasContext(canvas);

    // Attente du chargement des images (maison + robots) avant le rendu
    await this.loadCanvasImages();
    this.render();
  }

  /**
  * Nettoyage complet du service
  */
  public ngOnDestroy(): void {
    console.log("GameComponent - ngOnDestroy()");

    this.stopAllAnimation();
    console.log('Service de robots arrêté');
  }

  /**
* Nettoyage complet du service (animation où tous les robots s'arrêtent)
*/
  public onRobotsPause(): void {
    console.log("GameComponent - onRobotsPause()");

    this.isRunning = false;
    console.log('Service de robots mis en pause');
  }

  private stopAllAnimation(): void {
    console.log("GameComponent - stopAllAnimation()");

    console.log('Animation stopped');
    this.isRunning = false;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    // On vide la map de signaux (réinitialisation complète des robots)
    this._robotSignals.clear();
  }

  private pauseAllAnimation(): void {
    console.log("GameComponent - pauseAllAnimation()");

    console.log('Animation stopped');
    // important pour stopper l'animation quand plus de robot actif:
    this.isRunning = false;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    // On ne supprime pas la map de signaux pour une simple mise en pause
  }

  private drawGrille(): void {
    // console.log("GameComponent - drawGrille()");

    const maison = this.maisonNettoyageService.maisonSignal();

    maison.maison.forEach((row, rowIndex) => {

      //  tr-maison → background: rgb(0, 140, 133)
      // On peint d'abord toute la ligne en vert
      this.ctx.fillStyle = this.ROW_COLOR;
      this.ctx.fillRect(
        0,
        rowIndex * this.CELL_SIZE,
        maison.maison[0].length * this.CELL_SIZE,  // largeur totale de la ligne
        this.CELL_SIZE
      );

      row.forEach((cell, colIndex) => {
        const x = colIndex * this.CELL_SIZE;
        const y = rowIndex * this.CELL_SIZE;

        //  td-maison → border-style: none (pas de strokeRect)
        //  td-maison → text-align: center + padding: 0.5rem
        // Le padding s'applique des deux côtés → innerSize réduit de 2 * padding
        const innerSize = this.CELL_SIZE - this.CELL_PADDING * 2;  // 50 - 16 = 34px

        //  Centrage horizontal équivalent à text-align: center
        const offsetX = (this.CELL_SIZE - innerSize) / 2;
        const offsetY = (this.CELL_SIZE - innerSize) / 2;

        const img: HTMLImageElement | undefined = this.assetMaisonService.getImageForCell(cell.type);
        if (img) {
          this.ctx.drawImage(
            img,
            x + offsetX,   // centré horizontalement
            y + offsetY,   // centré verticalement
            innerSize,
            innerSize
          );
        }
      });
    });
  }

  private drawRobotLabels(robot: RobotModel, x: number, y: number): void {
    // console.log("GameComponent - drawRobotLabels()");

    const LABEL_HEIGHT = 28;  // hauteur totale des deux labels (12 + 16)

    // Détecte si les labels dépassent du canvas en bas
    const isNearBottom = (y + robot.robotWidth + LABEL_HEIGHT) > this.HEIGHT;

    // Bascule les labels au dessus du robot si trop près du bord
    const labelBaseY = isNearBottom
      ? y - 4                      // au dessus du robot
      : y + robot.robotWidth + 12;   // en dessous du robot

    const batterieOffsetY = isNearBottom ? -14 : 12;  // écart entre les deux labels

    // Label nom
    this.ctx.font = 'bold 8px Arial';
    this.ctx.fillStyle = robot.labelColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      robot.robotName ?? 'Theodule',
      x + robot.robotWidth / 2,
      labelBaseY
    );

    // TODO: idée - rajouter un type (famille) au robot (model), pour checker si c'est aspirateur ou autre type
    const robotAspirator: RobotAspiratorModel = robot as RobotAspiratorModel;
    if (!robotAspirator) return;

    // Label batterie (spécifique aux robots avec batteries - ex: aspirateur...)
    this.ctx.font = '8px Arial';
    this.ctx.fillStyle = this.assetRobotService.getRobotBatterieColor(robotAspirator.batterie);
    this.ctx.fillText(
      `${robotAspirator.batterie ?? -1}%`,
      x + robot.robotWidth / 2,
      labelBaseY + batterieOffsetY
    );
  }

  // Computed réactif basé sur le signal animationProgress
  private updateCurrentCoordinates(name: string): PixelPosition {
    // console.log("MaisonComponent - updateCurrentCoordinates()");

    const robotSignal: Signal<RobotModel | undefined> = this.robotDataService.getRobotSignal(name) as Signal<RobotModel | undefined>;
    if (!robotSignal) return new PixelPosition(-50, -50);
    // console.log(robotSignal);

    const robot: RobotModel | undefined = robotSignal();
    if (!robot) return new PixelPosition(-50, -50);

    // Dépend du signal animationProgress
    const progress = this.animationProgress();

    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    const newXCoordinate = robot.startCoordinate.x + (robot.targetCoordinate.x - robot.startCoordinate.x) * progress;
    const newYCoordinate = robot.startCoordinate.y + (robot.targetCoordinate.y - robot.startCoordinate.y) * progress;

    // Attention: inversion des coordonnées pour l'affichage: col = x, row = y
    return new PixelPosition(newXCoordinate, newYCoordinate);
  };

  private drawRobots() {
    // console.log("GameComponent - drawRobots()");

    const robotImage: HTMLImageElement = this.assetRobotService.getImage('robot');
    //  Guard clause — on ne dessine pas si l'image n'est pas chargée
    if (!robotImage) {
      console.warn('Image robot non chargée');
      return;
    }

    for (const [robotName, robotSignal] of this._robotSignals) {
      const robot: RobotModel | undefined = robotSignal();
      if (!robot) continue;

      // save() AVANT toute modification — isole complètement chaque robot
      this.ctx.save();

      const pixelPosition: PixelPosition = this.updateCurrentCoordinates(robotName);
      const x = pixelPosition.x;
      const y = pixelPosition.y;

      // Equivalent [style.width.px] / [style.height.px] → aspiroViewSize
      this.ctx.drawImage(
        robotImage,
        x, y,
        robot.robotWidth, robot.robotWidth
      );

      this.drawRobotLabels(robot, x, y);

      // restore() APRÈS tout le rendu du robot
      this.ctx.restore();
    }
  }

  /**
* Méthode principale de déclenchement de l'animation de la Map de robots
* @param maisonModel
* @returns
*/
  public startRobotsMapInterval(): void {
    console.log("GameComponent - startRobotsMapInterval()");

    if (this._robotSignals.size <= 0) return;

    // on ne démarre ici que si l'animation n'est pas encore activée
    if (this.isRunning) return;
    this.isRunning = true;

    let lastStepTime = performance.now();

    const animate = (currentTime: number) => {

      const deltaTime = currentTime - lastStepTime;

      const sequenceEnded = deltaTime >= this.STEP_DURATION;
      // on termine la séquence actuelle avant de mettre en pause l'animation
      if (!this.isRunning && sequenceEnded) {
        this.pauseAllAnimation();
        return;
      }
      // Nouvelle direction selon la durée de STEP_DURATION
      else if (sequenceEnded) {
        // s'il n'y a plus de robot actif à la fin de la séquence d'animation, on stoppe directement l'animation
        if (!this.hasActiveRobots()) {
          this.pauseAllAnimation();
          return;
        }

        // 1. Reset du temps
        lastStepTime = currentTime;
        // 2. Reset du progress à 0
        this.animationProgress.set(0);

        // 3. Calcul des nouvelles directions (qui lit progress = 0)
        // TODO: revoir avec factory pour un appel générique ici (méthode spécifique aux robots aspirateurs, actuellement)
        this.robotAspiratorService.calculateNewDirectionsForAllRobots();
        this.robotAspiratorService.updateRobotsVisitedCells();
      } else {
        // En cours d'animation
        const progress = deltaTime / this.STEP_DURATION;
        // Mettre à jour le signal de progression
        this.animationProgress.set(progress);
      }

      // 4. Mise à jour de la position du robot (vue)
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.robotAspiratorService.calculateNewDirectionsForAllRobots();
    this.robotAspiratorService.updateRobotsVisitedCells();

    // Mise à jour de la position du robot (vue)
    this.render();
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private log(message: string): void {
    this.loggerService.add(`GameComponent: ${message}`);
  }
}
