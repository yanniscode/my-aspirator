import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject, ViewChild, ElementRef, OnInit } from '@angular/core';

import { TableModule } from "primeng/table";

import { MessageService } from '../../services/message-service/message.service';
import { MaisonModel } from '../../classes/models/maison-model';
import { Position } from '../../classes/models/position';
import { Cell } from '../../classes/models/cell';

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
export class MaisonComponent implements OnInit {
  @ViewChild('maisonCanvas', { static: true }) maisonCanvas!: ElementRef<HTMLCanvasElement>;

  private messageService = inject(MessageService);

  private ctx!: CanvasRenderingContext2D;

  // Dimensions de la Maison et des Robots sur canvas
  private width = 500;
  private height = 400;

  // variables de template binding (@input vers le composant robot):
  public maisonViewModel: MaisonModel;
  public aspiroViewSize = 50;

  // Params de la maison (tableau)
  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  static maison: Cell[][] = [[]];

  constructor() {
    console.log("MaisonComponent - constructor()");

    this.maisonViewModel = new MaisonModel();
    this.maisonViewModel.largeurMaison = 10;
    this.maisonViewModel.hauteurMaison = 8;
    this.maisonViewModel.obstacles = [];
    this.maisonViewModel.isNettoyageComplete = false;
  }

  // on dessine une seule fois la maison, à son initialisation :
  ngOnInit(): void {
    this.drawCanvasElements();
  }

  public onMaisonPause(): void {
    console.log("MaisonComponent - onMaisonPause()");
  }

  public construireMaison(maisonModel: MaisonModel): void {
    console.log("MaisonComponent - construireMaison()");

    // Instanciation de la maison pour la Vue (composant MaisonComponent) :
    this.maisonViewModel = { ...maisonModel };
  }

  // TODO: la maison peut être dessinée seulement 1 fois à l'init
  private drawCanvasElements(): void {
    console.log("MaisonComponent - drawCanvasElements()");

    if (!this.ctx) return;

    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Redessine le canevas
    this.ctx.fillStyle = 'transparent';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // aspirateur avec image
    this.ctx.save();

    // Restaure l'état le plus récent du canevas
    this.ctx.restore();
  }

  private log(message: string): void {
    this.messageService.add(`MaisonComponent: ${message}`);
  }
}
