import { ChangeDetectionStrategy, Component, computed, inject, Input, Signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageService } from '../../services/message-service/message.service';

import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { RobotAspiratorDataService } from '../../services/robot-aspirator-data-service/robot-aspirator-data.service';
import { GridPosition } from '../../classes/models/grid-position';
import { PixelPosition } from '../../classes/models/pixel-position';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class RobotAspiratorComponent {

  private messageService: MessageService = inject(MessageService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  // TODO: refacto - faire passer datas à partir du service, et plus du parent:
  @Input() robotNameInput!: string;
  public aspiroViewSize = 50;

  // Injecter le signal une seule fois à l'initialisation
  public readonly robotServiceSignal: Signal<Signal<RobotAspiratorModel | undefined>> = computed(() =>
    this.robotAspiratorDataService.getRobotSignal(this.robotNameInput)
  );
  // Computed dédié pour le robot — pas d'effet de bord
  // Un computed() doit être une fonction pure: même entrées → même sortie, sans toucher à l'état extérieur
  public readonly robotViewModel = computed(() => {
    const signal = this.robotServiceSignal();
    return signal ? signal() : undefined;
  });

  // variables pour les couleurs du robot (actuellement: pour le nom)
  private colorLetters = '0123456789ABCDEF';
  public robotColor = '#';

  private setRandomRobotColor() {
    this.robotColor = "#";
    for (var i = 0; i < 6; i++) {
      this.robotColor += this.colorLetters[Math.floor(Math.random() * 16)];
    }
  }

  // Computed réactif basé sur le signal animationProgress
  public currentCoordinates: Signal<PixelPosition> = computed((): PixelPosition => {
    // console.log("RobotAspiratorComponent - currentCoordinates: computed()");

    const robot = this.robotViewModel();
    if (!robot) return new PixelPosition(-50, -50);
    // console.log(robot);

    // Dépend du signal animationProgress
    const progress = this.robotAspiratorDataService.animationProgress();

    // Interpolation linéaire (calcul de valeurs intermédiaires) entre startCoordinate et targetCoordinate
    const newXCoordinate = robot.startCoordinate.x + (robot.targetCoordinate.x - robot.startCoordinate.x) * progress;
    const newYCoordinate = robot.startCoordinate.y + (robot.targetCoordinate.y - robot.startCoordinate.y) * progress;

    // Attention: inversion des coordonnées pour l'affichage: col = x, row = y
    return new PixelPosition(newXCoordinate, newYCoordinate);
  });

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");
    // couleur aléatoire pour le nom du robot
    this.setRandomRobotColor();
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
