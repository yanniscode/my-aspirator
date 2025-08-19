import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

import { MessageService } from '../services/message-service/message.service';

import { MaisonComponent } from "./maison/maison.component";
import { MessagesComponent } from './messages/messages.component';

@Component({
  selector: 'app-root',
  standalone: true, // Composant autonome
  imports: [CommonModule, FormsModule, TableModule, MessagesComponent, MaisonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit, OnInit {
  // instantiation des composants enfants (un par robot)
  @ViewChild(MaisonComponent) maisonChildComponent!: MaisonComponent;

  // test du déplacement au clic
  // toggleAnimation() {
  //   console.log("toogle anim");
  //   this.aspiroDirX = 50;
  //   this.aspiroDirY = 0;
  //   this.aspiroX += this.aspiroDirX;
  //   this.aspiroY += this.aspiroDirY;

  //   console.log(this.aspiroX);
  //   console.log(this.aspiroY);
  //   this.moveTrigger++;
  // }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

  constructor(private messageService: MessageService) {
    this.messageService = messageService;
  }

  ngOnInit(): void {
    console.log('AppComponent ngOnInit() maisonComponent:', this.maisonChildComponent);

    // TODO: remettre l'intro dans un service app-service  :
    // Attendre que la vue soit complètement initialisée
    // setTimeout(() => {
    //   if (this.maisonChildComponent) {
    //     this.maisonChildComponent.startIntro();
    //   }
    // }, 100);
  }

  ngAfterViewInit() {
  // TODO: garder ? voir si startIntro() possible ici ?
    // Maintenant vous pouvez utiliser robotAspiratorComponents
    console.log('AppComponent ngAfterViewInit() maisonComponent:', this.maisonChildComponent);
    }

  public pause(): void {
    this.log("pause(");
    // TODO: tableau de robots:
    this.maisonChildComponent.onPause();
    // this.robot1?.pauseRobot();
    // this.robot2?.pauseRobot();
  }

  public start(): void {
    this.log("start(");
    this.maisonChildComponent.onStart();
  }

}
