import { Component, OnDestroy, ViewChild, ViewEncapsulation, inject, ChangeDetectionStrategy, computed, Signal, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { GameComponent } from '../game-component/game.component';
import { MessagesComponent } from '../messages-component/messages.component';
import { LoggerService } from '../../services/main-services/logger-service/logger.service';
import { RobotModel } from '../../classes/models/robot-model/robot-model';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/robot-services/robot-algos-deplacement-services/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';
import { RobotDataFactoryService } from '../../services/robot-services/robot-data-factory-service/robot-data-factory.service';
import { MaisonDataFactoryService } from '../../services/maison-services/maison-data-factory-service/maison-data-factory.service';
import { RobotActionAspiromanService } from '../../services/robot-services/robot-action-services/robot-action-aspiroman-service/robot-action-aspiroman.service';
import { AnimationFactoryService } from '../../services/main-services/graphics-services/animation-factory-service/animation-factory.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    GameComponent, MessagesComponent, FormsModule, TableModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default, // ATTENTION: ChangeDetectionStrategy.OnPush pourrait poser problème lors de l'affichage de la maison en intro
  providers: [RobotAspiratorWithNextPositionsTabService]
})
export class MainComponent implements AfterViewInit, OnDestroy {
  // instantiation de composant enfant
  @ViewChild(GameComponent) gameComponent!: GameComponent;

  private robotActionAspiromanService = inject(RobotActionAspiromanService);
  private maisonDataFactoryService = inject(MaisonDataFactoryService);
  // appel dans le template, donc public:
  public robotDataFactoryService = inject(RobotDataFactoryService);
  public animationFactoryService = inject(AnimationFactoryService);

  private loggerService = inject(LoggerService);

  // on récupère la liste de signals à partir de la factory de robots dans un type générique (RobotModel)
  public robotSignals: Map<string, Signal<RobotModel>> = this.robotDataFactoryService.robotSignals;

  // Signal computed qui expose les valeurs de la Map de robots sous forme de tableau
  public readonly robotsList: Signal<RobotModel[]> = computed(() =>
    Array.from(this.robotSignals.values()).map(signal => signal())
  );

  public robotViewModelTab: RobotModel[];

  private isRobotMapStarted: boolean = false;

  constructor() {
    console.log("MainComponent - constructor()");

    // initialisation des params de la maison et des robots
    this.maisonDataFactoryService.setMaisonParams();

    this.robotDataFactoryService.createRobotsParams();
    // copie de la liste de signaux pour le template, qui l'accepte mieux sous forme de tableau
    // pour éviter de multiples recalculs
    this.robotViewModelTab = this.robotsList();
    this.isRobotMapStarted = false;
  }

  ngAfterViewInit(): void {
    console.log("MainComponent - ngAfterViewInit()");
  }

  ngOnDestroy(): void {
    console.log('MainComponent - ngOnDestroy()');
    this.robotDataFactoryService.clearAllRobotsList();
    console.log(`Nettoyage de la méthode Main - ${this.robotViewModelTab.length} robots`);
  }

  @HostListener('body:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    // Attention: clavier américain
    // Joueur 1:
    if (event.code === 'KeyW') {
      this.robotActionAspiromanService.player1Move.set("ArrowUp");
      if (!this.animationFactoryService.isPlayer1Running) {
        this.gameComponent.onPlayerAction('Player 1');
      }
    }
    if (event.code === 'KeyD') {
      this.robotActionAspiromanService.player1Move.set("ArrowRight");
      if (!this.animationFactoryService.isPlayer1Running) {
        this.gameComponent.onPlayerAction('Player 1');
      }
    }
    if (event.code === 'KeyS') {
      this.robotActionAspiromanService.player1Move.set("ArrowDown");
      if (!this.animationFactoryService.isPlayer1Running) {
        this.gameComponent.onPlayerAction('Player 1');
      }
    }
    if (event.code === 'KeyA') {
      this.robotActionAspiromanService.player1Move.set("ArrowLeft");
      if (!this.animationFactoryService.isPlayer1Running) {
        this.gameComponent.onPlayerAction('Player 1');
      }
    }
    // Joueur 2:
    if (event.code === 'KeyI') {
      this.robotActionAspiromanService.player2Move.set("ArrowUp");
      if (!this.animationFactoryService.isPlayer2Running) {
        this.gameComponent.onPlayerAction('Player 2');
      }
    }
    if (event.code === 'KeyL') {
      this.robotActionAspiromanService.player2Move.set("ArrowRight");
      if (!this.animationFactoryService.isPlayer2Running) {
        this.gameComponent.onPlayerAction('Player 2');
      }
    }
    if (event.code === 'KeyK') {
      this.robotActionAspiromanService.player2Move.set("ArrowDown");
      if (!this.animationFactoryService.isPlayer2Running) {
        this.gameComponent.onPlayerAction('Player 2');
      }
    }
    if (event.code === 'KeyJ') {
      this.robotActionAspiromanService.player2Move.set("ArrowLeft");
      if (!this.animationFactoryService.isPlayer2Running) {
        this.gameComponent.onPlayerAction('Player 2');
      }
    }

    // touches utilitaires (start / pause)
    // else
    if (event.code === 'Enter' && !this.isRobotMapStarted) {
      console.log("Enter start()");
      setTimeout(() => {
        this.start();
        // } else if (event.code === 'Space' && !this.gameStarted && !this.gameOver) {
        // this.gameStarted = true;
        // this.gameLoop();
      }, 1);
    }
    else if (event.code === 'Enter' && this.isRobotMapStarted) {
      setTimeout(() => {
        console.log("Enter pause()");
        this.pause();
      }, 500);
    }
  }

// TODO: supprimer (cause bugs) ?
  // @HostListener('body:keyup', ['$event'])
  // keyUp(event: KeyboardEvent) {
  //   if (event.code === 'Enter') {
  //     this.pause();
  //   }
  // }

  public pause(): void {
    console.log("MainComponent - pause");

    if (this.isRobotMapStarted) {
      this.gameComponent.onPause();
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  public start(): void {
    console.log("MainComponent - start()");

    // Démarrage avec des signaux:
    if (!this.isRobotMapStarted) {
      this.gameComponent.onStart();
      this.isRobotMapStarted = true;
    } else {
      console.log("(re)démarrage impossible");
    }
  }

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
