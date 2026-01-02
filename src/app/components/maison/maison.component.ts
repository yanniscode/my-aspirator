import { trigger, transition, style, animate } from '@angular/animations';

import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject, ViewChild, ElementRef, ViewChildren, QueryList, OnDestroy, AfterViewInit } from '@angular/core';

import { TableModule } from "primeng/table";

import { MessageService } from '../../services/message-service/message.service';
import { MaisonModel } from '../../classes/models/maison-model';
import { RobotAspiratorComponent } from "../robot-aspirator/robot-aspirator.component";
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { Position } from '../../classes/models/position';
import { Cell } from '../../classes/models/cell';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-maison',
  standalone: true,
  imports: [TableModule, RobotAspiratorComponent],
  templateUrl: './maison.component.html',
  styleUrl: './maison.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  animations: [
    // TODO: supprimer car obsolète
    trigger('maisonAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1500ms ease-out', style({ opacity: 1 }))
      ])
    ]),
  ]
})
export class MaisonComponent implements AfterViewInit, OnDestroy {

  private messageService = inject(MessageService);

  @ViewChild('maisonCanvas', { static: true }) maisonCanvas!: ElementRef<HTMLCanvasElement>;
  // TODO : utiliser ??
  // @ViewChildren(RobotAspiratorComponent) robotAspiratorChildComponents!: QueryList<RobotAspiratorComponent>;

  private ctx!: CanvasRenderingContext2D;
  private aspiratorImage!: HTMLImageElement;
  // private aspiratorImage!: ElementRef<HTMLImageElement>;
  private aspiratorImageLoaded = false;

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private updateDrawEverything!: Subscription;

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

  // TODO: utiliser ??
  // getter de la Maison pour le template
  // get MaisonView() {
  //   return MaisonComponent.maison;
  // }


  // ************************

  // TODO: var globale ici à passer à l'enfant (@Input)
  public robotViewModel: RobotAspiratorModel;

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

  public construireMaison(maisonModel: MaisonModel): void {
    console.log("MaisonComponent - construireMaison()");

    // instanciation de la maison pour la Vue (composant MaisonComponent) :
    this.maisonViewModel = { ...maisonModel };
  }

  private log(message: string): void {
    this.messageService.add(`MaisonComponent: ${message}`);
  }


  // ***************************

  ngAfterViewInit(): void {
    // this.ctx = this.maisonCanvas.nativeElement.getContext('2d')!;
  }

  ngOnDestroy(): void {
    console.log("MaisonComponent - ngOnDestroy()");

    // Se désabonner pour éviter les fuites de mémoire
    if (this.updateDrawEverything) {
      this.updateDrawEverything.unsubscribe();
    }
  }

  // utiliser ??
  public onMaisonPause(): void {
    console.log("MaisonComponent - onMaisonPause()");

    if (this.updateDrawEverything) {
      this.updateDrawEverything.unsubscribe();
    }
  }

  // utilisé ??
  // Output de l'enfant Robot
  // testé avant avec ngAfterViewInit ??
  public onImageReady(imgElement: HTMLImageElement) {
    console.log("MaisonComponent - onImageReady()");

    this.aspiratorImage = imgElement;
    // this.aspiratorImage = this.robotAspiratorComponent.aspiratorImageElement;
    console.log(this.aspiratorImage);

    // Si l'image est déjà chargée (cache du navigateur)
    this.ctx = this.maisonCanvas.nativeElement.getContext('2d')!;

    // Chargement de l'image de l'aspirateur
    this.aspiratorImage.onload = () => {
      console.log("ya ! onload");
      this.aspiratorImageLoaded = true;
    };

    if (this.aspiratorImage.complete) {
      console.log("ya ! this.aspiratorImage.complete");

      this.aspiratorImageLoaded = true;

      // TODO: UTILISER ICI: ne fait rien ??
      this.updateDrawEverything = this.drawEverything().subscribe({
        next: () => {
          // console.log('next : updateDrawEverything');
        },
        error: (err: string) => {
          this.log('Erreur updateDrawEverything: ' + err);
        },
        complete: () => {
          console.log('complete updateDrawEverything: ok !');
          this.updateDrawEverything.unsubscribe();
        }
      });
    }

    // TODO: remplacer par appel des données initialisées dans app-main:
    // passé dans ngOnChanges (TEST)
    // let robotModelTest = this.robotModelsTabTest[0];
    // console.log(robotModelTest);

    // this.updateMaisonWithRobot(robotModelTest);
  }

  // à utiliser ?? >> pour récupérer le robot actualisé >> non recommandé d'avoir 2 bindings enfant > parent dans ce cas
  // méthode pour récupérer la nouvelle valeur du Robot depuis le composant enfant et mettre à jour la vue (Robot et Maison)
  // public handleRobotUpdate(robotUpdateModel: RobotAspiratorModel): void {

  //   console.log("MaisonComponent - handleRobotUpdate()");
  //   RobotAspiratorModel.logger(robotUpdateModel);

  //   if (robotUpdateModel.batterie >= 0) { // >= pour prendre en compte le dernier mouvement
  //     this.updateMaisonWithRobot(robotUpdateModel);

  //     // ancien update de positions ici ??
  //     // this.updateRobotView(robotUpdateModel);
  //     // this.maisonService.updateMaisonCells(this.maisonViewModel, robotUpdateModel.lastPosition);
  //   }
  // }

  // TODO: private possible ??
  public updateMaisonWithRobot(robotUpdateModel: RobotAspiratorModel): void {
    console.log("MaisonComponent - updateMaisonWithRobot()");

    this.robotViewModel = { ...robotUpdateModel };

    this.setAspiroPosition(this.robotViewModel);

    this.setAspiroDirection(this.robotViewModel);

    this.updateDrawEverything = this.drawEverything().subscribe({
      next: (i: number) => {
        // console.log('next : updateDrawEverything');
        // console.log(i);

        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Redessine le canevas
        this.ctx.fillStyle = 'transparent';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // aspirateur avec image
        if (this.aspiratorImageLoaded) {
          this.ctx.save();

          // TODO: revoir pour tableau de robots:
          // if (robotUpdateModel.robotName === "robot1") {

          // TODO: ?? gérer la nouvelle position dans l'enfant robot
          // aspiroViewX: utilisation de variable pour la vue, différente de AspiroX, qui est un index dans le tableau (maison)
          this.aspiroViewX += this.aspiroDirX;
          this.aspiroViewY += this.aspiroDirY;

          // Déplacement de l'aspirateur
          // TODO: supprimer ici si déplacement appliqué directement dans la classe robot:
          // this.ctx.translate(this.aspiroViewX + this.aspiroViewSize / 2, this.aspiroViewY + this.aspiroViewSize / 2);

          // TODO: remplacer par dessin dans le composant robot
          // dessine l'aspirateur:
          // this.ctx.drawImage(
          //   this.aspiratorImage,
          //   (-this.aspiroViewSize / 2),
          //   (-this.aspiroViewSize / 2),
          //   this.aspiroViewSize,
          //   this.aspiroViewSize
          // );

          // else if (robotUpdateModel.robotName === "robot2") {
          //     this.aspiroX2 += aspiroDirX;
          //     this.aspiroY2 += aspiroDirY;
          //   }
          // else if (robotUpdateModel.robotName === "robot3") {
          //     this.aspiroX3 += aspiroDirX;
          //     this.aspiroY3 += aspiroDirY;
          //   }
          // else if (robotUpdateModel.robotName === "robot4") {
          //     this.aspiroX4 += aspiroDirX;
          //     this.aspiroY4 += aspiroDirY;
          //   }

          // Restaure l'état le plus récent du canevas, s'il existe, ou bien ne fait rien
          this.ctx.restore();

        }
      },
      error: (err) => {
        console.log('Erreur updateDrawEverything: ' + err);
      },
      complete: () => {
        console.log('complete updateDrawEverything: ok !');
        this.updateDrawEverything.unsubscribe();
      }
    });
  }

  private drawEverything(): Observable<number> {
    console.log("MaisonComponent - drawEverything()");

    return new Observable((observer) => {
      let i: number = 0;

      const intervalId = setInterval(() => {
        // console.log("i = " + i);
        observer.next(i);
        i++;
        if (i >= 50) {
          console.log("drawEverything() unsubscribe !");
          this.updateDrawEverything.unsubscribe();
          observer.complete();
        }
      }, 1); // Émet une nouvelle valeur toutes les ms
      // Gestion de l'annulation de l'intervalle si l'observable est désabonné
      return () => {
        clearInterval(intervalId);
      };
    });
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
}
