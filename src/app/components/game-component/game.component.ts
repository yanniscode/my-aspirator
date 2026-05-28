import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit, HostListener, computed, Signal, OnDestroy } from '@angular/core';
import { TableModule } from "primeng/table";
import { LoggerService } from '../../services/main-services/logger-service/logger.service';
import { FormsModule } from '@angular/forms';
import { AnimationFactoryService } from '../../services/main-services/graphics-services/animation-factory-service/animation-factory.service';
import { MaisonDataFactoryService } from '../../services/maison-services/maison-data-factory-service/maison-data-factory.service';
import { RobotDataFactoryService } from '../../services/robot-services/robot-data-factory-service/robot-data-factory.service';
import { ActionFactoryService } from '../../services/main-services/graphics-services/action-factory-service/action-factory.service';
import { RobotModel } from '../../classes/models/robot-model/robot-model';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [FormsModule, TableModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
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


  private maisonDataFactoryService = inject(MaisonDataFactoryService);
  // Appel du Service dans le template, donc public:
  public robotDataFactoryService = inject(RobotDataFactoryService);

  private actionFactoryService = inject(ActionFactoryService);

  private animationFactoryService = inject(AnimationFactoryService);

  private loggerService = inject(LoggerService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px


  // on récupère la liste de signaux à partir de la factory de robots dans un type générique (RobotModel)
  public robotSignals: Map<string, Signal<RobotModel>> = this.robotDataFactoryService.robotSignals;

  // Signal computed qui expose les valeurs de la Map de robots sous forme de tableau
  public readonly robotsList: Signal<RobotModel[]> = computed(() =>
    Array.from(this.robotSignals.values()).map(signal => signal())
  );

  public robotViewModelTab: RobotModel[];

  private isRobotMapStarted: boolean = false;

  constructor() {
    console.log("GameComponent - constructor()");

    // initialisation des paramètres de la maison et des robots
    this.maisonDataFactoryService.setMaisonParams();

    this.robotDataFactoryService.createRobotsParams();

    this.actionFactoryService.createPlayersActionParams();

    this.animationFactoryService.createRobotPlayersAnimationParams();

    // Copie de la liste de signaux pour le template, qui l'accepte mieux sous forme de tableau [] d'objets,
    // ce qui évite de multiples recalculs
    this.robotViewModelTab = this.robotsList();
  }

  ngOnDestroy(): void {
    console.log('GameComponent - ngOnDestroy()');
    this.robotDataFactoryService.clearAllRobotsList();
    console.log(`Nettoyage de la map générique de signaux - ${this.robotViewModelTab.length} robots`);
  }

  /**
 * initialise le canvas après la vue
 */
  async ngAfterViewInit(): Promise<void> {
    console.log("GameComponent - ngAfterViewInit()");

    const maison = this.maisonDataFactoryService.maisonSignal();

    // adaptation de la taille du canvas à la maison (représente tout l'environnement)
    const canvas = this.gameCanvas.nativeElement;
    canvas.width = maison.maison[0].length * this.CELL_SIZE;
    canvas.height = maison.maison.length * this.CELL_SIZE;

    // Fix Firefox
    // on doit assigner la valeur du ctx pour le Canvas
    this.ctx = this.animationFactoryService.initCanvasContext(canvas);

    // Attente du chargement des images (maison) avant le rendu
    await this.animationFactoryService.loadCanvasImages();

    this.ctx = this.animationFactoryService.renderAnimation(this.ctx);
  }

  /**
   * Mise en pause du jeu
   */
  public pause(): void {
    console.log("MainComponent - pause");

    if (this.isRobotMapStarted) {
      this.animationFactoryService.onPause();
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  /**
   * Démarrage du jeu
   */
  public start(): void {
    console.log("MainComponent - start()");

    // Démarrage avec des signaux:
    if (!this.isRobotMapStarted) {
      this.animationFactoryService.onStart();
      this.isRobotMapStarted = true;
    } else {
      console.log("(re)démarrage impossible");
    }
  }


  /**
   * Ecoute des actions utilisateur (Attention ! touches pour clavier américain)
   *
   * @param event
   * @returns
   */
  @HostListener('body:keydown', ['$event'])
  public keyDown(event: KeyboardEvent) {
    // Joueur 1:
    const isPlayer1RunningSignal = this.animationFactoryService.isPlayerRunningSignals.get("Player 1");
    const player1MoveDirectionSignal = this.actionFactoryService.getPlayerMoveDirectionSignals("Player 1");
    if (!player1MoveDirectionSignal) return;

    if (event.code === 'KeyW') {
      player1MoveDirectionSignal.set("ArrowUp");
      if (isPlayer1RunningSignal && isPlayer1RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 1');
      }
    }
    if (event.code === 'KeyD') {
      player1MoveDirectionSignal.set("ArrowRight");
      if (isPlayer1RunningSignal && isPlayer1RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 1');
      }
    }
    if (event.code === 'KeyS') {
      player1MoveDirectionSignal.set("ArrowDown");
      if (isPlayer1RunningSignal && isPlayer1RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 1');
      }
    }
    if (event.code === 'KeyA') {
      player1MoveDirectionSignal.set("ArrowLeft");
      if (isPlayer1RunningSignal && isPlayer1RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 1');
      }
    }
    // Joueur 2:
    const isPlayer2RunningSignal = this.animationFactoryService.isPlayerRunningSignals.get("Player 2");
    const player2MoveDirectionSignal = this.actionFactoryService.getPlayerMoveDirectionSignals("Player 2");
    if (!player2MoveDirectionSignal) return;

    if (event.code === 'KeyI') {
      player2MoveDirectionSignal.set("ArrowUp");
      if (isPlayer2RunningSignal && isPlayer2RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 2');
      }
    }
    if (event.code === 'KeyL') {
      player2MoveDirectionSignal.set("ArrowRight");
      if (isPlayer2RunningSignal && isPlayer2RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 2');
      }
    }
    if (event.code === 'KeyK') {
      player2MoveDirectionSignal.set("ArrowDown");
      if (isPlayer2RunningSignal && isPlayer2RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 2');
      }
    }
    if (event.code === 'KeyJ') {
      player2MoveDirectionSignal.set("ArrowLeft");
      if (isPlayer2RunningSignal && isPlayer2RunningSignal() === false) {
        this.animationFactoryService.onPlayerAction('Player 2');
      }
    }

    // TODO: revoir ici: cas ou clics répétés sur Enter > bugs animation
    if (event.code === 'Enter' && !this.isRobotMapStarted) {
      setTimeout(() => {
        console.log("Enter start()");
        this.start();
      }, 250);
    }
    else if (event.code === 'Enter' && this.isRobotMapStarted) {
      setTimeout(() => {
        console.log("Enter pause()");
        this.pause();
      }, 500);
    }
  }

  private log(message: string): void {
    this.loggerService.add(`GameComponent: ${message}`);
  }
}
