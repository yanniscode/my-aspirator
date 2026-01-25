import { AfterContentInit, ChangeDetectionStrategy, Component, inject, Input, OnInit, signal, Signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageService } from '../../services/message-service/message.service';

import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { RobotAspiratorDataService } from '../../services/robot-aspirator-data-service/robot-aspirator-data.service';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class RobotAspiratorComponent implements AfterContentInit, OnInit {

  private messageService: MessageService = inject(MessageService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);

  // TODO: refacto - faire passer datas à partir du service, et plus du parent:
  @Input() robotNameInput!: string;

  public aspiroViewSize = 50;

  // Signal en LECTURE SEULE depuis le service
  public robotViewModel: Signal<RobotAspiratorModel | undefined>;

  // attendre l'initialisation des robots avant de déclencher effect()
  private areRobotsInitialized = signal(false);

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");

    this.robotViewModel = signal(undefined);
  }
  ngOnInit(): void {
    // Récupère le signal en lecture seule depuis le service
    this.robotViewModel = this.robotAspiratorDataService.getRobotSignal(this.robotNameInput);
  }

  ngAfterContentInit(): void {
    this.areRobotsInitialized.set(true);
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}