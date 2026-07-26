import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit, HostListener, Signal, OnDestroy } from '@angular/core';
import { TableModule } from "primeng/table";
import { LoggerService } from '../../services/main-services/logger-service/logger.service';
import { FormsModule } from '@angular/forms';
import { AnimationFactoryService } from '../../services/main-services/graphics-services/animation-factory-service/animation-factory.service';
import { MaisonDataFactoryService } from '../../services/maison-services/maison-data-factory-service/maison-data-factory.service';
import { RobotDataFactoryService } from '../../services/robot-services/robot-data-factory-service/robot-data-factory.service';
import { RobotModel } from '../../classes/models/robot-model/robot-model';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { MaisonModel } from '../../classes/models/maison-model/maison-model';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [FormsModule, TableModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  private animationFactoryService = inject(AnimationFactoryService);

  private loggerService = inject(LoggerService);

  protected ctx!: CanvasRenderingContext2D;

  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px

  private get maisonSignal(): MaisonModel {
    return this.maisonDataFactoryService.maisonSignal();
  }

  // on récupère la liste de signaux à partir de la factory de robots dans un type générique (RobotModel)
  public robotNames: Signal<string[]> = this.robotDataFactoryService.robotNames;

  public robotSignal(name: string): Signal<RobotModel | undefined> {
    return this.robotDataFactoryService.getRobotSignal(name);
  }

  private isRobotMapStarted: boolean = false;

  // Signal de synchronisation entre constructor (maison) et ngAfterViewInit (canvas)
  private maisonReady$ = new Subject<void>();
  // Signal de synchronisation entre constructor (robots) et ngAfterViewInit (canvas)
  private robotsReady$ = new Subject<void>();

  private endedSubscription$ = new Subject<void>();

  constructor() {
    console.log("GameComponent - constructor()");

    // initialisation des paramètres de la maison et des robots
    this.maisonDataFactoryService.createMaisonParams().pipe(takeUntil(this.endedSubscription$))
      .subscribe(() => {
        // this.robotDataFactoryService.createPlayersActionParams();
        // this.animationFactoryService.createRobotPlayersAnimationParams();
        this.maisonReady$.next();    // ✅ notifie que les robots sont prêts
        this.maisonReady$.complete();
      });

    this.robotDataFactoryService.createRobotsParams().pipe(takeUntil(this.endedSubscription$))
      .subscribe(() => {
        this.robotDataFactoryService.createPlayersActionParams();
        this.animationFactoryService.createRobotPlayersAnimationParams();
        this.robotsReady$.next();    // ✅ notifie que les robots sont prêts
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
    // ✅ attend que les deux soient terminés avant de rendre
    await Promise.all([
      this.animationFactoryService.loadCanvasImages(),
      firstValueFrom(this.robotsReady$),  // attend le Subject
      firstValueFrom(this.maisonReady$)   // attend le Subject
    ]);

    // const maison = this.maisonDataFactoryService.maisonSignal();

    // adaptation de la taille du canvas à la maison (représente tout l'environnement)
    const canvas = this.gameCanvas.nativeElement;
    canvas.width = this.maisonSignal.maison[0].length * this.CELL_SIZE;
    canvas.height = this.maisonSignal.maison.length * this.CELL_SIZE;

    // Fix Firefox
    // on doit assigner la valeur du ctx pour le Canvas
    this.ctx = this.animationFactoryService.initCanvasContext(canvas);

    // ✅ dessine la première frame immédiatement sans démarrer la boucle
    // Note: Firefox a besoin d'un tick supplémentaire avant de rendre
    // Firefox maintient le canvas en état "lazy" jusqu'au premier cycle de rendu du navigateur (paint).
    // Le fillRect dans initCanvasContext() force bien un premier dessin synchrone (d'où le fond jaune visible),
    // mais les appels suivants dans le même tick synchrone sont ignorés ou écrasés avant que le navigateur n'ait eu le temps
    // de les peindre à l'écran.
    // requestAnimationFrame garantit que drawInitialFrame() s'exécute au début du prochain cycle de peinture, quand Firefox est prêt.
    // (l'appel doit être doublé !)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.animationFactoryService.renderAnimation(this.ctx);
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
    // Joueur 1:
    const player1MoveDirectionSignal = this.robotDataFactoryService.getPlayerMoveDirectionSignals("Player 1");
    if (!player1MoveDirectionSignal) return;

    const isPlayer1RunningSignal = this.animationFactoryService.isPlayerRunningSignals.get("Player 1");

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
    const player2MoveDirectionSignal = this.robotDataFactoryService.getPlayerMoveDirectionSignals("Player 2");
    if (!player2MoveDirectionSignal) return;

    const isPlayer2RunningSignal = this.animationFactoryService.isPlayerRunningSignals.get("Player 2");

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
