import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject, ViewChild, ElementRef, OnDestroy, signal, output, OutputEmitterRef } from '@angular/core';

import { TableModule } from "primeng/table";

import { MessageService } from '../../services/message-service/message.service';
import { MaisonModel } from '../../classes/models/maison-model';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { Position } from '../../classes/models/position';
import { Cell } from '../../classes/models/cell';
import { interval, Subject, Subscription, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-maison',
  standalone: true,
  imports: [TableModule],
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

  // variables de template binding (@input vers le composant robot):
  public maisonViewModel: MaisonModel;
  public aspiroViewSize = 50;
  public aspiroViewName = "";
  // Positions du robot pour la vue (en px, cette fois !)
  public onRobotCoordinateUpdate: OutputEmitterRef<Position> = output<Position>();

  // Params de la maison (tableau)
  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  static maison: Cell[][] = [[]];

  public robotViewModel: RobotAspiratorModel;

  // variables pour l'animation des robots
  private counter = signal(0);
  private animationId?: number;
  private isRunning = false;

  constructor() {
    console.log("MaisonComponent - constructor()");

    this.maisonViewModel = new MaisonModel();
    this.maisonViewModel.largeurMaison = 10;
    this.maisonViewModel.hauteurMaison = 8;
    this.maisonViewModel.obstacles = [];
    this.maisonViewModel.isNettoyageComplete = false;

    this.robotViewModel = new RobotAspiratorModel();
  }

  ngOnDestroy(): void {
    console.log("MaisonComponent - ngOnDestroy()");

    // Pour startDrawCanvasTimer() - V1:
    // this.drawCanvasInterval.unsubscribe();
    // this.destroy$.next();
    // this.destroy$.complete();
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
   * Output de l'enfant Robot récupéré à partir de MainComponent
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

  // TODO: instanciation pose pb ici en multibots
  private nextCoordinate: Position = new Position(0, 0);

  public drawCanvasElements(aspiroDirX: number, aspiroDirY: number): void {
    console.log("MaisonComponent - drawCanvasElements()");

    if (!this.ctx) return;

    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Redessine le canevas
    this.ctx.fillStyle = 'transparent';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // aspirateur avec image
    if (this.aspiratorImageLoaded) {
      this.ctx.save();

      // utilisation de variables en px pour la vue, différente de AspiroX, qui est un index dans le tableau (maison)
      this.nextCoordinate.x += aspiroDirX;
      this.nextCoordinate.y += aspiroDirY;

      // transmission au comosant parent via output
      this.onRobotCoordinateUpdate.emit(this.nextCoordinate);

      // Restaure l'état le plus récent du canevas
      this.ctx.restore();
    }
  }

  private log(message: string): void {
    this.messageService.add(`MaisonComponent: ${message}`);
  }
}
