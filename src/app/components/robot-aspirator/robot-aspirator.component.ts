import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageService } from '../../services/message-service/message.service';

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
export class RobotAspiratorComponent implements OnChanges {

  private messageService: MessageService = inject(MessageService);

  // TODO: refacto - faire passer datas à partir du service, et plus du parent:
  @Input() robotNameInput!: string;

  public aspiroViewSize = 50;

  // Signal en LECTURE SEULE depuis le service
  public robotViewModel: Signal<RobotAspiratorModel | undefined>;

  // attendre l'initialisation des robots avant de déclencher effect()
  private areRobotsInitialized = signal(false);

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");
    this.robotAspiroSizeInput = 0;
    this.robotAspiroName = "";
    this.aspiroCoordinateInput = new Position();
  }

  ngOnChanges(): void {
    console.log("RobotAspiratorComponent - ngOnChanges()");

    console.log(this.robotAspiroName);
    console.log(this.robotAspiroSizeInput);
    console.log(this.aspiroCoordinateInput.x);
    console.log(this.aspiroCoordinateInput.y);
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
