import { Component, OnDestroy, ViewChild, ViewEncapsulation, inject, Signal, computed, ChangeDetectionStrategy, effect, signal, AfterContentInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

import { MaisonService } from '../../services/maison-service/maison.service';

import { MaisonComponent } from '../maison/maison.component';
import { MessagesComponent } from '../messages/messages.component';

import { MaisonModel } from '../../classes/models/maison-model';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MessageService } from '../../services/message-service/message.service';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/robot-actions-service/robot-aspirator-with-next-positions-tab-service/robot-aspirator/robot-aspirator/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';
import { RobotAspiratorDataService } from '../../services/robot-aspirator-data-service/robot-aspirator-data.service';
import { Position } from '../../classes/models/position';
import { RobotAspiratorComponent } from '../robot-aspirator/robot-aspirator.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MaisonComponent, RobotAspiratorComponent, MessagesComponent, FormsModule, TableModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default, // ATTENTION: ChangeDetectionStrategy.OnPush pourrait poser problème lors de l'affichage de la maison en intro
  providers: [RobotAspiratorWithNextPositionsTabService]
})
export class MainComponent implements AfterContentInit, OnDestroy {
  // instantiation de composant enfant
  @ViewChild(MaisonComponent) maisonChildComponent!: MaisonComponent;

  private messageService = inject(MessageService);
  private maisonService = inject(MaisonService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  public maisonModel: MaisonModel;

  public robotModelsTab: RobotAspiratorModel[];

  // Map pour stocker les signaux computed de chaque robot à afficher
  private robotDataViewSignals = new Map<string, Signal<RobotAspiratorModel | undefined>>();

  private isRobotMapStarted: boolean = false;

  // attendre l'initialisation des robots avant de déclencher effect()
  private areRobotsInitialized = signal(false);

  // Positions du robot (Attention: index dans le tableau, ici, pas une position en px)
  public aspiroX = 0;
  public aspiroY = 0;
  private aspiroDirX = 0;
  private aspiroDirY = 0;

  // variables de template binding (@input vers le composant robot):
  private ctx!: CanvasRenderingContext2D;
  private aspiratorImage!: HTMLImageElement;
  private aspiratorImageLoaded = false;
  public aspiroViewSize = 50;
  public aspiroViewName = "";

  // Positions du robot pour la vue (en px, cette fois !)
  // position settée avec la valeur récupérée par l'output de la Maison dans MainComponent
  public robotAspiratorCoordinate: Position = new Position();

  // variables pour l'animation des robots
  private counter = signal(0);
  private animationId?: number;
  private isRunning = false;

  constructor() {
    console.log("MainComponent - constructor()");

    // initialisation des params de la maison et des robots
    this.maisonModel = { ...this.maisonService.getMaisonParams() };
    this.robotModelsTab = [...this.robotAspiratorDataService.getRobotsParams()];

    this.isRobotMapStarted = false;

    effect(() => {
      // Réagir aux effets de bord pour tous les robots
      console.log("MainComponent constructor() - effect()");

      // N'exécuter que si initialisé - nécessaire pour déclencher l'animation du déplacement (marche pas sans, actuellement)
      if (!this.areRobotsInitialized()) return;

      this.updateAllRobotsViews();
    });
  }
  // évite une ExpressionChangedAfterItHasBeenCheckedError
  ngAfterContentInit(): void {
    console.log('MainComponent - ngAfterContentInit()');

    // mini-delai pour attendre la fin de l'initialisation de l'enfant MaisonComponent
    setTimeout(() => {
      if (!this.maisonChildComponent) return;
      this.maisonChildComponent.construireMaison(this.maisonModel);

      this.maisonChildComponent.onImageReady(this.imgElement);
    });
    this.initRobotsDatas();

    this.areRobotsInitialized.set(true);
  }

  ngOnDestroy(): void {
    console.log('MainComponent - ngOnDestroy()');
    this.robotModelsTab.forEach(robotModel => {
      this.robotAspiratorDataService.unregisterRobotFromList(robotModel.robotName);
    });
    console.log(`Nettoyage du composant Maison - ${this.robotModelsTab.length} robots`);

    this.robotDataViewSignals.clear();
  }

  public pause(): void {
    console.log("MainComponent - pause");

    if (this.isRobotMapStarted) {
      this.robotAspiratorDataService.onRobotPause();
      this.isRobotMapStarted = false;
    } else {
      console.log("robot(s) actuellement en pause");
    }
  }

  public start(): void {
    console.log("MainComponent - start()");

    // Démarrage avec des signaux:
    if (!this.isRobotMapStarted) {
      this.robotAspiratorDataService.startRobotsMapInterval(this.maisonModel);
      this.isRobotMapStarted = true;
    } else {
      console.log("(re)démarrage impossible");
    }
  }

  /**
  * Getter local sur le signal d'un robot : utilisé par le template
  */
  public getRobotDataView(robotName: string): Signal<RobotAspiratorModel | undefined> {
    console.log("MainComponent - getRobotDataView()");

    return this.robotDataViewSignals.get(robotName) || computed(() => undefined);
  }

  private initRobotsDatas(): void {
    console.log("MainComponent - initRobotsDatas()");

    this.robotModelsTab.forEach((robotModel: RobotAspiratorModel) => {
      // 1/ ajout du robot à la liste:
      this.robotAspiratorDataService.registerRobotInList(robotModel);
      // 2/ créer un signal computed pour chaque robot
      this.createRobotSignal(robotModel.robotName);
      // 3/ Ajout de la base du robot dans la Maison
      const robotBasePosition: Position = { ...robotModel.basePosition };
      this.maisonModel = { ...this.maisonService.updateMaisonConfig(this.maisonModel, robotBasePosition) };
    });
  }

  /**
  * Crée un signal computed pour un robot spécifique dans le composant appelant le service
  */
  private createRobotSignal(robotName: string): void {
    console.log("MainComponent - createRobotSignal()");

    const robotSignal: Signal<RobotAspiratorModel> | undefined = this.robotAspiratorDataService.getRobotSignal(robotName);
    if (!robotSignal) return;

    this.robotDataViewSignals.set(robotName, robotSignal);
  }

  /**
  * Lancement de l'update de la vue pour la liste de robots
  */
  private updateAllRobotsViews(): void {
    console.log('MainComponent - updateAllRobotsViews()');

    this.robotDataViewSignals.forEach((robotSignal) => {
      const robot = robotSignal();
      if (robot) {
        console.log(robot);
        this.performViewUpdate(robot);
      }
    });
  }

  /**
  * Update de la vue (maison et robots)
  */
  private performViewUpdate(robot: RobotAspiratorModel): void {
    console.log("MainComponent - performViewUpdate()");

    this.updateMaisonWithRobot(robot);
    this.maisonService.updateMaisonCellules(this.maisonModel, robot.lastPosition);
  }

  /**
 * méthode de mise à jour de la position du robot
 */
  private updateMaisonWithRobot(robot: RobotAspiratorModel): void {
    console.log("MaisonComponent - updateMaisonWithRobot()");

    this.aspiroViewName = robot.robotName;
    this.setAspiroPosition(robot);
    this.setAspiroDirection(robot);

    this.startDrawCanvasTimer();
  }

  private setAspiroPosition(robot: RobotAspiratorModel) {
    console.log("MaisonComponent - setAspiroPosition()");

    this.aspiroX = robot.position.x;
    this.aspiroY = robot.position.y;
  }

  private setAspiroDirection(robot: RobotAspiratorModel) {
    console.log("MaisonComponent - setAspiroDirection()");

    this.aspiroDirX = (this.aspiroX - robot.lastPosition.x) === 1 ? 1 :
      (this.aspiroX - robot.lastPosition.x) === -1 ? -1 : 0;
    this.aspiroDirY = (this.aspiroY - robot.lastPosition.y) === 1 ? 1 :
      (this.aspiroY - robot.lastPosition.y) === -1 ? -1 : 0;
  }

  // méthode de template binding
  public handleRobotCoordinateUpdate(nextRobotCoordinate: Position): void {

    const robot = this.robotAspiratorDataService.getRobot(this.aspiroViewName);
    robot.coordinate = { ...nextRobotCoordinate };
    this.robotAspiratorDataService.moveRobotOnView(robot.robotName, robot.coordinate);
  }

  private imgElement: HTMLImageElement = document.createElement("img");

  /**
 * Output de l'enfant Robot repassé à l'enfant de MainComponent > MaisonComponent
 */
  public onImageReady(imgElement: HTMLImageElement) {
    console.log("MainComponent - onImageReady()");
    this.imgElement = imgElement;
    // attention : maisonChildComponent peut être undefined au refresh)
    if (!this.maisonChildComponent) return;
    this.maisonChildComponent.onImageReady(this.imgElement);
  }

  // V2: test animation précise mais plus lente (risque de décallage du robot avec les positions visitées)
  private startDrawCanvasTimer(): void {
    console.log("MaisonComponent - startDrawCanvasTimer()");

    if (this.isRunning) return; // Éviter les doublons

    console.log('Timer started');
    console.log('requestAnimationFrame existe ?', typeof requestAnimationFrame); // ✅ Devrait afficher "function"

    this.isRunning = true;
    const startTime = performance.now();
    let count = 0;

    const animate = (currentTime: number) => {
      if (!this.isRunning) return; // Vérifier si l'animation doit continuer

      const elapsed = currentTime - startTime;
      const frame = Math.floor(elapsed);
      count++;
      console.log(`Frame: ${frame}, Iteration: ${count}`);

      if (count <= 50) { // attention à setInterval() de 1000 au moins sinon retard du robot sur l'algo de déplacement
        this.counter.set(count); // ✅ Utiliser count au lieu de frame pour régularité
        this.maisonChildComponent.drawCanvasElements(this.aspiroDirX, this.aspiroDirY);

        this.animationId = requestAnimationFrame(animate); // ✅ Stocker l'id de l'animation
      } else {
        console.log('Animation terminée');
        this.stopAnimation(); // ✅ Utilise stopAnimation au lieu de ngOnDestroy
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }


  // // V1:
  // private startDrawCanvasTimer(): void {
  //   console.log("MaisonComponent - startDrawCanvasTimer()");

  //   this.counter.set(0);

  //   this.drawCanvasInterval = interval(1)
  //     .pipe(
  //       take(50), // Prend exactement 50 valeurs (0 à 49)
  //       takeUntil(this.destroy$)
  //     )
  //     .subscribe(value => {
  //       this.counter.set(value);
  //       console.log(this.counter());
  //       this.drawCanvasElements();
  //     });
  // }

  private stopAnimation(): void {
    console.log('Animation stopped');
    this.isRunning = false;
    if (this.animationId !== undefined) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
  }

  private log(message: string) {
    this.messageService.add(`MainComponent: ${message}`);
  }
}
