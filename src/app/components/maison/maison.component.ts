import { trigger, transition, style, animate } from '@angular/animations';
import { NgFor, NgIf } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { MessageService } from '../../services/message.service';
import { TableModule } from "primeng/table";
import { CellElement } from '../../classes/models/cellElement';
import { Maison } from '../../classes/models/maison';
import { Position } from '../../classes/models/position';

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

  public maisonView: Maison;

  constructor(private messageService: MessageService) {
    this.maisonView = new Maison();
    // TODO: revoir maison sans static ??
    this.maisonView.largeurMaison = 10;
    this.maisonView.hauteurMaison = 8;
    this.maisonView.obstacles = [];
  }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

  // TODO: classe maison:
  public creerMaison(): void {
    this.log("créer maison");
    for (let y = 0; y < this.maisonView.hauteurMaison; y++) {
      this.maisonView.maison[y] = [];
      for (let x = 0; x < this.maisonView.largeurMaison; x++) {
        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        this.maisonView.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }
    // Ajouter les obstacles
    this.maisonView.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < this.maisonView.largeurMaison && obs.y >= 0 && obs.y < this.maisonView.hauteurMaison) {
        this.maisonView.maison[obs.y][obs.x].cellStack[0].type = 'X';
      }
    });
  }

  public updateMaisonView(lastPosition: Position): void {
    console.log("updateMaisonView");
    console.log("lastPosition.x = " + lastPosition.x);
    console.log("lastPosition.x = " + lastPosition.y);

    // on ne veut pas que la case de la base soit modifiée:
    if (this.maisonView.maison[lastPosition.y][lastPosition.x].cellStack[0].type !== 'B') {
      this.maisonView.maison[lastPosition.y][lastPosition.x].cellStack[0].visited = true;
      this.maisonView.maison[lastPosition.y][lastPosition.x].cellStack[0].type = '_';
    }
  }
}
