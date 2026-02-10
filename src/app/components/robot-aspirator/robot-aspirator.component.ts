import { ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal, Signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageService } from '../../services/message-service/message.service';

import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { RobotAspiratorDataService } from '../../services/robot-aspirator-data-service/robot-aspirator-data.service';
import { Position } from '../../classes/models/position';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class RobotAspiratorComponent implements OnInit {

  private messageService: MessageService = inject(MessageService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  // TODO: refacto - faire passer datas à partir du service, et plus du parent:
  @Input() robotNameInput!: string;
  public aspiroViewSize = 50;
  // Signal en LECTURE SEULE depuis le service
  public robotViewModel: Signal<RobotAspiratorModel | undefined>;

  // ✅ Computed réactif basé sur le signal animationProgress
  public currentCoordinates: Signal<Position> = computed(() => {
    const robot = this.robotViewModel();
    if (!robot) return new Position(-50, -50);

    // ✅ Dépend du signal animationProgress
    const progress = this.robotAspiratorDataService.animationProgress();

    // Interpolation linéaire entre startCoordinate et targetCoordinate
    const newXCoordinate = robot.startCoordinate.x + (robot.targetCoordinate.x - robot.startCoordinate.x) * progress;
    const newYCoordinate = robot.startCoordinate.y + (robot.targetCoordinate.y - robot.startCoordinate.y) * progress;

    return new Position(newXCoordinate, newYCoordinate);
  });

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");
    // Initialisation temporaire
    this.robotViewModel = signal(undefined);
  }
  ngOnInit(): void {
    // Récupère le signal en lecture seule depuis le service
    // Le signal se mettra à jour automatiquement quand le service modifie les données
    this.robotViewModel = this.robotAspiratorDataService.getRobotSignal(this.robotNameInput);
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
