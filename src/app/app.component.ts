import { NgFor, NgIf } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Observable, Subscription } from "rxjs";
import { TableModule } from 'primeng/table';

import { MessageService } from './services/message.service';
import { MessagesComponent } from "./messages/messages.component";

import { Position } from './classes/position';
import { RobotAspirator } from './classes/robotaspirator';
import { Cell } from './classes/cell';
import { CellElement } from './classes/cellElement';

@Component({
  selector: 'app-root',
  imports: [NgFor, NgIf, FormsModule, MessagesComponent, TableModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('maisonAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1500ms ease-out', style({ opacity: 1 }))
      ]),
      // transition(':leave', [
      //   animate('1000ms ease-out', style({ opacity: 0 }))
      // ])
    ])
  ]
})
export class AppComponent {
  title = 'my-aspirator-robot';

  @ViewChild('aspiratorCanvas', { static: true }) aspiratorCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('aspiratorImage', { static: true }) aspiratorImage!: ElementRef<HTMLImageElement>;

  private ctx!: CanvasRenderingContext2D;
  private aspiratorImageLoaded = false;

  // Dimensions
  private width = 500;
  private height = 400;
  private aspiroSize = 50;
  // Positions
  private aspiroX = 0;
  private aspiroY = 0;
  private aspiroDirX = 0;
  private aspiroDirY = 0;
  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private updateSubscriptionNettoyer!: Subscription;
  private updateSubscriptionRetourABase!: Subscription;
  private updateDrawEverything!: Subscription;

  static largeurMaison: number = 10;
  static hauteurMaison: number = 8;
  static obstacles: Position[] = [];
  static maison: Cell[][] = [[]];
  get MaisonView() {
    return AppComponent.maison;
  }
  static basePosition: Position = { x: 0, y: 0 };
  static robot: RobotAspirator;
  static isRobotStarted: boolean = false;
  static robotAtLastPosition: RobotAspirator;
  static messageService: MessageService;

  constructor(messageService: MessageService) {
    AppComponent.messageService = messageService;

    AppComponent.initMaisonConfig();

    AppComponent.robot = new RobotAspirator(this);
    AppComponent.robotAtLastPosition = new RobotAspirator(this);
  }


  ngOnInit(): void {
    console.log("ya ngOnInit");
    this.ctx = this.aspiratorCanvas.nativeElement.getContext('2d')!;

    // Chargement de l'image de l'aspirateur
    this.aspiratorImage.nativeElement.onload = () => {
      console.log("ya ! onload");
      this.aspiratorImageLoaded = true;
    };

    // Si l'image est déjà chargée (cache du navigateur)
    if (this.aspiratorImage.nativeElement.complete) {
      console.log("ya ! complete");
      this.aspiratorImageLoaded = true;
      this.updateDrawEverything = this.drawEverything().subscribe({
        next: () => {
          AppComponent.log('next : updateDrawEverything');
        },
        error: (err) => {
          AppComponent.log('Erreur updateDrawEverything: ' + err);
        },
        complete: () => {
          AppComponent.log('complete updateDrawEverything: ok !');
          this.updateDrawEverything.unsubscribe();
        }
      });
    }

    this.startIntro();
  }
  
  ngOnDestroy(): void {
    // Se désabonner pour éviter les fuites de mémoire
    if (this.updateSubscriptionNettoyer) {
      this.updateSubscriptionNettoyer.unsubscribe();
    }
    if (this.updateSubscriptionRetourABase) {
      this.updateSubscriptionRetourABase.unsubscribe();
    }
    if (this.updateDrawEverything) {
      this.updateDrawEverything.unsubscribe();
    }
  }

  static initMaisonConfig(): void {
    AppComponent.log("initMaisonConfig");
    // Création de la maison
    AppComponent.largeurMaison = 10;
    AppComponent.hauteurMaison = 8;
    AppComponent.obstacles = [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ];
    AppComponent.basePosition = { x: 0, y: 0 };
    AppComponent.creerMaison();
  }

  static creerMaison(): void {
    console.log("créer maison");
    for (let y = 0; y < AppComponent.hauteurMaison; y++) {
      AppComponent.maison[y] = [];
      for (let x = 0; x < AppComponent.largeurMaison; x++) {

        let cellElement: CellElement = {
          position: { x, y },
          type: 'O',
          visited: false
        };
        let cellStack: CellElement[] = [];
        cellStack.push(cellElement);
        AppComponent.maison[y][x] = {
          cellStack: cellStack
        }
      }
    }
    // Ajouter les obstacles
    AppComponent.obstacles.forEach(obs => {
      if (obs.x >= 0 && obs.x < AppComponent.largeurMaison && obs.y >= 0 && obs.y < AppComponent.hauteurMaison) {
        AppComponent.maison[obs.y][obs.x].cellStack[0].type = 'X';
      }
    });
    // Position de la base de charge
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].cellStack[0].type = 'B';
    AppComponent.maison[AppComponent.basePosition.y][AppComponent.basePosition.x].cellStack[0].visited = true;
  }

  private startIntro(): void {
    // Création de la maison
    AppComponent.initMaisonConfig();

    // Créer et démarrer le robot
    // rafraîchissement de l'affichage de la maison avec le robot à sa nouvelle position
    AppComponent.robot = new RobotAspirator(this);
    AppComponent.robotAtLastPosition = new RobotAspirator(this);

    setTimeout(() => {
      // remplace un élément du tableau par le robot et l'affiche
      this.updateMaisonWithRobot();
    }, 1000);
  }

  startRobot(): void {
    if (AppComponent.isRobotStarted === true) {
      return;
    }

    // si l'on préfère afficher le robot seulement après clic sur start:
    //    AppComponent.updateMaisonWithRobot();

    AppComponent.log("Début du nettoyage");
    AppComponent.isRobotStarted = true;
    // algo principal de nettoyage de la maison
    this.updateSubscriptionNettoyer = AppComponent.robot.nettoyer().subscribe({
      next: () => {
        AppComponent.log('next nettoyer...');
      },
      error: (err) => {
        AppComponent.log('Erreur nettoyer: ' + err);
      },
      complete: () => {
        AppComponent.log('complete nettoyer: Nettoyage ok !');
        // Retourner à la base de charge
        AppComponent.log(`Batterie: ${AppComponent.robot.batterie}%. Retour à la base.`);

        // puis on souscrit à retournerALaBase
        this.updateSubscriptionRetourABase = AppComponent.robot.retournerALaBase().subscribe({
          next: (robot) => {
            AppComponent.log('next retournerALaBase...');
            AppComponent.log(AppComponent.robotAtLastPosition.position.x.toString());
            AppComponent.log(AppComponent.robotAtLastPosition.position.y.toString());
            AppComponent.log(robot.position.x.toString());
            AppComponent.log(robot.position.y.toString());
          },
          error: (err) => {
            AppComponent.log('Erreur retournerALaBase: ' + err);
          },
          complete: () => {
            AppComponent.log('complete retournerALaBase: ok !');
            AppComponent.isRobotStarted = false;
            this.startIntro();
          }
        });
      }
    });
  }

  pauseRobot(): void {
    if (this.updateSubscriptionNettoyer) {
      this.updateSubscriptionNettoyer.unsubscribe();
      this.updateDrawEverything.unsubscribe();
      AppComponent.isRobotStarted = false;
    }
  }

  // Vérifier si toutes les cellules accessibles ont été visitées
  static toutEstNettoye(): boolean {
    for (let i = 0; i < AppComponent.maison.length; i++) {
      for (let j = 0; j < AppComponent.maison[i].length; j++) {
        const cell: Cell = AppComponent.maison[i][j];
        if (cell.cellStack[0].type !== 'X' && cell.cellStack[0].type !== 'B' && !cell.cellStack[0].visited) {
          return false;
        }
      }
    }
    return true;
  }

  public updateMaisonWithRobot(): void {
    console.log("ya updateMaisonWithRobot");
    this.setAspiroDirection();
    this.updateDrawEverything = this.drawEverything().subscribe({
      next: (i) => {
        console.log('next : updateDrawEverything');
        console.log(i);
        this.aspiroX += this.aspiroDirX;
        this.aspiroY += this.aspiroDirY;
        console.log("this.aspiroSize = "+ this.aspiroSize);
        console.log("this.aspiroDirX = "+ this.aspiroDirX);
        console.log("this.aspiroDirY = "+ this.aspiroDirY);

        console.log("this.aspiroX ="+ this.aspiroX);
        console.log("this.aspiroY ="+ this.aspiroY);

        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Redessine le canevas
        this.ctx.fillStyle = 'transparent';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // aspirateur avec image
        if (this.aspiratorImageLoaded) {
          this.ctx.save();
          // Déplacement de l'aspirateur
          this.ctx.translate(this.aspiroX + this.aspiroSize / 2, this.aspiroY + this.aspiroSize / 2);

          // Dessiner l'image centrée
          this.ctx.drawImage(
            this.aspiratorImage.nativeElement,
            (-this.aspiroSize / 2),
            (-this.aspiroSize / 2),
            this.aspiroSize,
            this.aspiroSize
          );
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
  
  private setAspiroDirection() {
    this.aspiroDirX = (AppComponent.robot.position.x - AppComponent.robotAtLastPosition.position.x) === 1 ? 1   :
      (AppComponent.robot.position.x - AppComponent.robotAtLastPosition.position.x) === -1 ? -1 : 0;
    this.aspiroDirY = (AppComponent.robot.position.y - AppComponent.robotAtLastPosition.position.y) === 1 ? 1 :
      (AppComponent.robot.position.y - AppComponent.robotAtLastPosition.position.y) === -1 ? -1 : 0;
  }

  private drawEverything(): Observable<number> {
    return new Observable((observer) => {
      let i: number = 0;

      const intervalId = setInterval(() => {
        console.log("i = "+ i);
        observer.next(i);
        i++;
        if(i >= 50) {
          console.log("unsubscribe !");
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

  static log(message: string) {
    AppComponent.messageService.add(`AppComponent: ${message}`);
  }
}
