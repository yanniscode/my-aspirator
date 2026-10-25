import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit, HostListener, OnDestroy, WritableSignal } from '@angular/core';
import { LoggerService } from '../../services/main-services/logger-service/logger.service';
import { FormsModule } from '@angular/forms';
import { AnimationFactoryService } from '../../services/main-services/graphics-services/animation-factory-service/animation-factory.service';
import { MaisonDataFactoryService } from '../../services/maison-services/maison-data-factory-service/maison-data-factory.service';
import { RobotDataFactoryService } from '../../services/robot-services/robot-data-factory-service/robot-data-factory.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { CellStore } from '../../data-stores/maison.signal-store';
import { RobotStore } from '../../data-stores/robot.signal-store';
import { isAspiroman, isRobotAspirator } from '../../data-access/robot-data-access/robot.model';

@Component({
  selector: 'app-game',
  standalone: true,
  providers: [CellStore],
  imports: [FormsModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;

  private maisonDataFactoryService = inject(MaisonDataFactoryService);
  // Appel du Service dans le template, donc public:
  public robotDataFactoryService = inject(RobotDataFactoryService);
  private animationFactoryService = inject(AnimationFactoryService);

  public readonly cellStore = inject(CellStore);
  public readonly robotStore = inject(RobotStore);

  private loggerService = inject(LoggerService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px

  protected readonly isAspiroman = isAspiroman;
  protected readonly isRobotAspirator = isRobotAspirator;

  private isRobotMapStarted: boolean = false;

  // Signal de synchronisation entre constructor (maison) et ngAfterViewInit (canvas)
  private maisonReady$ = new Subject<void>();
  // Signal de synchronisation entre constructor (robots) et ngAfterViewInit (canvas)
  private robotsReady$ = new Subject<void>();

  private endedSubscription$ = new Subject<void>();

  private static readonly PLAYER_KEYS: Record<string, { playerId: string; direction: string }> = {
    // Joueur 1 (ZQSD sur clavier US)
    KeyW: { playerId: 'player-1', direction: 'ArrowUp' },
    KeyD: { playerId: 'player-1', direction: 'ArrowRight' },
    KeyS: { playerId: 'player-1', direction: 'ArrowDown' },
    KeyA: { playerId: 'player-1', direction: 'ArrowLeft' },
    // Joueur 2 (IJKL sur clavier US)
    KeyI: { playerId: 'player-2', direction: 'ArrowUp' },
    KeyL: { playerId: 'player-2', direction: 'ArrowRight' },
    KeyK: { playerId: 'player-2', direction: 'ArrowDown' },
    KeyJ: { playerId: 'player-2', direction: 'ArrowLeft' },
  };

  constructor() {
    console.log("GameComponent - constructor()");

    // initialisation des paramètres de la maison et des robots
    this.maisonDataFactoryService.createMaisonParams().pipe(takeUntil(this.endedSubscription$))
      .subscribe(() => {
        this.maisonReady$.next();    // notifie que les robots sont prêts
        this.maisonReady$.complete();
      });

    this.robotDataFactoryService.createRobotsParams().pipe(takeUntil(this.endedSubscription$))
      .subscribe(() => {
        // TODO: laisser ici ?
        // this.robotDataFactoryService.createPlayersActionParams();
        this.animationFactoryService.createRobotPlayersAnimationParams();
        this.robotsReady$.next();    // notifie que les robots sont prêts
        this.robotsReady$.complete();
      });
  }

  ngOnDestroy(): void {
    console.log('GameComponent - ngOnDestroy()');
    this.endedSubscription$.next();
    this.endedSubscription$.complete();
    this.robotsReady$.complete();
    this.maisonReady$.complete();
  }

  /**
 * initialise le canvas après la vue
 */
  async ngAfterViewInit(): Promise<void> {
    console.log("GameComponent - ngAfterViewInit()");


    // Attente du chargement des images (maison et robots) avant le rendu
    // Attend que les deux soient terminés avant de rendre
    await Promise.all([
      this.animationFactoryService.loadCanvasImages(),
      firstValueFrom(this.robotsReady$),  // attend le Subject
      firstValueFrom(this.maisonReady$)   // attend le Subject
    ]);

    // const maison = this.maisonDataFactoryService.maisonSignal();

    // adaptation de la taille du canvas à la maison (représente tout l'environnement)
    const canvas = this.gameCanvas.nativeElement;
    canvas.width = this.cellStore.cols() * this.CELL_SIZE;
    canvas.height = this.cellStore.rows() * this.CELL_SIZE;

    // Fix Firefox
    // on doit assigner la valeur du ctx pour le Canvas
    this.ctx = this.animationFactoryService.initCanvasContext(canvas);

    // dessine la première frame immédiatement sans démarrer la boucle
    // Note: Firefox a besoin d'un tick supplémentaire avant de rendre
    // Firefox maintient le canvas en état "lazy" jusqu'au premier cycle de rendu du navigateur (paint).
    // Le fillRect dans initCanvasContext() force bien un premier dessin synchrone (d'où le fond jaune visible),
    // mais les appels suivants dans le même tick synchrone sont ignorés ou écrasés avant que le navigateur n'ait eu le temps
    // de les peindre à l'écran.
    // requestAnimationFrame garantit que drawInitialFrame() s'exécute au début du prochain cycle de peinture, quand Firefox est prêt.
    // (l'appel doit être doublé > voire triplé !)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.animationFactoryService.renderAnimation(this.ctx);
        });
      });
    });
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

    const binding = GameComponent.PLAYER_KEYS[event.code];
    if (!binding) return;

    // ✅ Garde centralisée : joueur éliminé → input ignoré
    const robot = this.robotStore.playerById(binding.playerId);
    if (!robot) return;

    if (isAspiroman(robot) && robot.isEliminated) return;

    const directionSignal = this.robotDataFactoryService.getPlayerMoveDirectionSignals(binding.playerId);
    if (!directionSignal) return;

    directionSignal.set(binding.direction);

    const runningSignal: WritableSignal<boolean> | undefined = this.animationFactoryService.isPlayerRunningSignals.get(binding.playerId);
    if (!runningSignal) return;

    if (runningSignal() === false) {
      this.animationFactoryService.onPlayerAction(binding.playerId);
    }
  }

  private log(message: string): void {
    this.loggerService.add(`GameComponent: ${message}`);
  }
}
