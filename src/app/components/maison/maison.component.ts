import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject, ViewChild, ElementRef, OnDestroy, signal } from '@angular/core';

import { TableModule } from "primeng/table";

import { MessageService } from '../../services/message-service/message.service';
import { MaisonModel } from '../../classes/models/maison-model';
import { RobotAspiratorComponent } from "../robot-aspirator/robot-aspirator.component";
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { Position } from '../../classes/models/position';
import { Cell } from '../../classes/models/cell';
import { interval, Subject, Subscription, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-maison',
  standalone: true,
  imports: [TableModule, RobotAspiratorComponent],
  templateUrl: './maison.component.html',
  styleUrl: './maison.component.css',
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
export class MaisonComponent implements OnDestroy {
  @ViewChild('maisonCanvas', { static: true }) maisonCanvas!: ElementRef<HTMLCanvasElement>;

  private messageService = inject(MessageService);

  private ctx!: CanvasRenderingContext2D;
  private aspiratorImage!: HTMLImageElement;
  private aspiratorImageLoaded = false;

  // Dimensions de la Maison et des Robots sur canvas
  private width = 500;
  private height = 400;

  // variable de template binding (@input vers le composant robot):
  public maisonViewModel: MaisonModel;
  // variable de template binding (@input vers le composant robot):
  public aspiroViewSize = 50;

  // TODO: déplacer directement dans la classe robot ??
  // Positions du robot (Attention: index dans le tableau, ici, pas une position en px)
  public aspiroX = 0;
  public aspiroY = 0;
  private aspiroDirX = 0;
  private aspiroDirY = 0;

  // Positions du robot pour la vue (en px, cette fois !)
  public aspiroViewX = 0;
  public aspiroViewY = 0;


  // Params de la maison (tableau)
  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  static maison: Cell[][] = [[]];

  public robotViewModel: RobotAspiratorModel;

  private counter = signal(0);
  private destroy$ = new Subject<void>();
  private drawCanvasInterval: Subscription = new Subscription();


  // *** ROBOT 1:
  // Variables pour la mise à jour de la Vue (public car appelées par le template)
  // Position robot 1 (en px)
  // public aspiroX1: number;
  // public aspiroY1: number;
  // // pour mettre à jour l'animation du déplacement du robot
  // public moveTrigger1: number;

  // // *** ROBOT 2:
  // public aspiroX2: number;
  // public aspiroY2: number;
  // public moveTrigger2: number;

  // // *** ROBOT 3:
  // public aspiroX3: number;
  // public aspiroY3: number;
  // public moveTrigger3: number;

  // // *** ROBOT 4:
  // public aspiroX4: number;
  // public aspiroY4: number;
  // public moveTrigger4: number;

  // **************************

  constructor() {
    console.log("MaisonComponent - constructor()");

    this.maisonViewModel = new MaisonModel();
    this.maisonViewModel.largeurMaison = 10;
    this.maisonViewModel.hauteurMaison = 8;
    this.maisonViewModel.obstacles = [];
    this.maisonViewModel.isNettoyageComplete = false;

    this.robotViewModel = new RobotAspiratorModel();

    // this.aspiroX1 = 0;
    // this.aspiroY1 = 0;
    // this.moveTrigger1 = 0;

    // this.aspiroX2 = 450;
    // this.aspiroY2 = 0;
    // this.moveTrigger2 = 0;

    // this.aspiroX3 = 450;
    // this.aspiroY3 = 350;
    // this.moveTrigger3 = 0;

    // this.aspiroX4 = 0;
    // this.aspiroY4 = 350;
    // this.moveTrigger4 = 0;
  }

  ngOnDestroy(): void {
    console.log("MaisonComponent - ngOnDestroy()");

    this.drawCanvasInterval.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onMaisonPause(): void {
    console.log("MaisonComponent - onMaisonPause()");
  }

  public construireMaison(maisonModel: MaisonModel): void {
    console.log("MaisonComponent - construireMaison()");

    // instanciation de la maison pour la Vue (composant MaisonComponent) :
    this.maisonViewModel = { ...maisonModel };
  }

  /**
   * Output de l'enfant Robot
   */
  public onImageReady(imgElement: HTMLImageElement) {
    console.log("MaisonComponent - onImageReady()");

    this.aspiratorImage = imgElement;
    console.log(this.aspiratorImage);

    // Si l'image est déjà chargée (cache du navigateur)
    this.ctx = this.maisonCanvas.nativeElement.getContext('2d')!;

    // Chargement de l'image de l'aspirateur
    this.aspiratorImage.onload = () => {
      this.aspiratorImageLoaded = true;
    };

    if (this.aspiratorImage.complete) {
      this.aspiratorImageLoaded = true;
    }
  }

  /**
   * méthode de mise à jour de la position du robot
   */
  public updateMaisonWithRobot(robotUpdateModel: RobotAspiratorModel): void {
    console.log("MaisonComponent - updateMaisonWithRobot()");

    this.robotViewModel = { ...robotUpdateModel };

    this.setAspiroPosition(this.robotViewModel);
    this.setAspiroDirection(this.robotViewModel);

    this.startDrawCanvasTimer();
  }

  // V1:
  private startDrawCanvasTimer(): void {
    console.log("MaisonComponent - startDrawCanvasTimer()");

    this.counter.set(0);

    this.drawCanvasInterval = interval(1)
      .pipe(
        take(50), // Prend exactement 50 valeurs (0 à 49)
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.counter.set(value);
        console.log(this.counter());
        this.drawCanvasElements();
      });
  }

  // **********

  // // V2: test animation précise mais plus lente (risque de décallage du robot avec les positions visitées)
  // private startDrawCanvasTimer(): void {
  //   console.log('Timer started');
  //   const startTime = performance.now();
  //   let count = 0;

  //   const animate = (currentTime: number) => {
  //     const elapsed = currentTime - startTime;
  //     const frame = Math.floor(elapsed);

  //     count++;
  //     console.log(`Frame: ${frame}, Iteration: ${count}`);

  //     this.counter.set(frame);
  //     this.drawCanvasElements();

  //     if (count < 50) {
  //       requestAnimationFrame(animate); // Continue l'animation
  //     } else {
  //       console.log('Animation terminée');
  //       this.ngOnDestroy();
  //     }
  //   };

  //   requestAnimationFrame(animate);
  // }

  private drawCanvasElements() {
    console.log("MaisonComponent - drawCanvasElements()");

    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Redessine le canevas
    this.ctx.fillStyle = 'transparent';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // aspirateur avec image
    if (this.aspiratorImageLoaded) {
      this.ctx.save();

      // utilisation de variables en px pour la vue, différente de AspiroX, qui est un index dans le tableau (maison)
      this.aspiroViewX += this.aspiroDirX;
      this.aspiroViewY += this.aspiroDirY;

      // Restaure l'état le plus récent du canevas
      this.ctx.restore();
    }
  }

  private setAspiroPosition(robotUpdateModel: RobotAspiratorModel) {
    console.log("MaisonComponent - setAspiroPosition()");

    this.aspiroX = robotUpdateModel.position.x;
    this.aspiroY = robotUpdateModel.position.y;
  }

  private setAspiroDirection(robotUpdateModel: RobotAspiratorModel) {
    console.log("MaisonComponent - setAspiroDirection()");

    this.aspiroDirX = (this.aspiroX - robotUpdateModel.lastPosition.x) === 1 ? 1 :
      (this.aspiroX - robotUpdateModel.lastPosition.x) === -1 ? -1 : 0;
    this.aspiroDirY = (this.aspiroY - robotUpdateModel.lastPosition.y) === 1 ? 1 :
      (this.aspiroY - robotUpdateModel.lastPosition.y) === -1 ? -1 : 0;
  }

  private log(message: string): void {
    this.messageService.add(`MaisonComponent: ${message}`);
  }
}
