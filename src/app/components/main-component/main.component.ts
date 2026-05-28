import { Component, ViewChild, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { GameComponent } from '../game-component/game.component';
import { MessagesComponent } from '../messages-component/messages.component';
import { LoggerService } from '../../services/main-services/logger-service/logger.service';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/robot-services/robot-algos-deplacement-services/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    GameComponent, MessagesComponent, FormsModule, TableModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  changeDetection: ChangeDetectionStrategy.Default, // ATTENTION: ChangeDetectionStrategy.OnPush pourrait poser problème lors de l'affichage de la maison en intro
  providers: [RobotAspiratorWithNextPositionsTabService]
})
export class MainComponent {
  // Instantiation du composant enfant contenant le jeu
  @ViewChild(GameComponent) gameComponent!: GameComponent;

  private loggerService = inject(LoggerService);

  constructor() {
    console.log("MainComponent - constructor()");
  }

  private log(message: string) {
    this.loggerService.add(`MainComponent: ${message}`);
  }
}
