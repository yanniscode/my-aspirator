import { trigger, transition, style, animate } from '@angular/animations';
import { NgFor, NgIf } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { Position } from '../../classes/position';
import { CellElement } from '../../classes/cellElement';
import { MessageService } from '../../services/message.service';
import { MaisonModel } from '../../classes/maison-model';
import { TableModule } from "primeng/table";

@Component({
  selector: 'app-maison',
  imports: [NgFor, NgIf, TableModule],
  templateUrl: './maison.component.html',
  styleUrl: './maison.component.css',
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('maisonAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1500ms ease-out', style({ opacity: 1 }))
      ])
    ]),
  ]
})
export class MaisonComponent {

  public maisonModel: MaisonModel;

  constructor(private messageService: MessageService) {
    this.maisonModel = new MaisonModel();
    MaisonModel.largeurMaison = 10;
    MaisonModel.hauteurMaison = 8;
    MaisonModel.obstacles = [];
  }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

  // TODO: classe maison:
  public creerMaison(): void {
    this.log("créer maison");
    for (let y = 0; y < MaisonModel.hauteurMaison; y++) {
      this.maisonModel.maison[y] = [];
      for (let x = 0; x < MaisonModel.largeurMaison; x++) {
        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        this.maisonModel.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }
    // Ajouter les obstacles
    MaisonModel.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < MaisonModel.largeurMaison && obs.y >= 0 && obs.y < MaisonModel.hauteurMaison) {
        this.maisonModel.maison[obs.y][obs.x].cellStack[0].type = 'X';
      }
    });
  }

  public updateMaisonView(lastPosition: Position): void {

    console.log("updateMaisonView");
    console.log("lastPosition.x = " + lastPosition.x);
    console.log("lastPosition.x = " + lastPosition.y);

    // on ne veut pas que la case de la base soit modifiée:
    if (this.maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0].type !== 'B') {
      this.maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0].visited = true;
      this.maisonModel.maison[lastPosition.y][lastPosition.x].cellStack[0].type = '_';
    }
  }
}
