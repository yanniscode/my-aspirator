import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../../services/message.service';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { Cell } from '../../classes/models/cell';
import { Position } from '../../classes/models/position';
import { RobotAspirator } from '../../classes/models/robot-aspirator';
import { RobotServiceDtoOut } from '../../classes/dtos/robot-service-dto-out';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true, // Composant autonome
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  encapsulation: ViewEncapsulation.None
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  public basePosition: Position;
  // Position actuelle
  @Input() lastPositionInput: Position;
  @Input() positionInput: Position;
  // Niveau de batterie (en pourcentage)
  @Input() batterie: number;

  @Output() robotUpdate: EventEmitter<RobotAspirator> = new EventEmitter();
  private robotOutput: RobotAspirator;

  // Combien d'énergie est consommée par mouvement
  public consommationParMouvement: number;

  // private isRobotStarted: boolean;

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }

  ngOnDestroy(): void {
    this.robotAspiratorService.onPause();
    if (this.subscription) {
      this.log("RobotAspiratorComponent - ngOnDestroy unsubscribe !");
      this.subscription.unsubscribe();
    }
  }

  constructor(private messageService: MessageService, private robotAspiratorService: RobotAspiratorService) {

    // TODO: ne plus instancier avec new ici:
    // this.robotAspiratorService = new RobotAspiratorService(messageService);

    // valeurs par défaut pour l'init du robot:
    this.basePosition = { x: -1, y: -1 };
    this.lastPositionInput = { ...this.basePosition };
    this.positionInput = { ...this.basePosition };
    this.batterie = -1;

    // this.isRobotStarted = false;
    // this.energieRetourBase = 0; // Sera calculée dynamiquement
    // Combien d'énergie est consommée par mouvement
    this.consommationParMouvement = 0.5;

    this.robotOutput = new RobotAspirator();
  }

  public pauseRobot(): void {
    this.robotAspiratorService.onPause();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    // this.isRobotStarted = false;
    this.robotOutput.isRobotStarted = false;
  }


  // ********************

  public startRobot(maison: Cell[][], robot: RobotAspirator): void {
    // A l'intro, pas de souscription, donc on l'initialise ici
    // si on clique plusieurs fois sur start, la souscription existe, et est ouverte, donc on ne resouscrit pas
    // si on restart après mise en pause, la souscription existe à l'état closed, on la réinitialise ici
    if (!this.subscription || this.subscription.closed) {
      this.startAspiratorRobot(maison, robot);
      // this.robotAspiratorService.addRobotToSubscription(maison, robot2, "robot2");
    }
  }

  // méthode séparée, car à l'avenir, un robot peut avoir d'autres spécialités que l'aspi !
  private startAspiratorRobot(maison: Cell[][], robot: RobotAspirator) {
    // public addRobotToSubscription(subscription: Subscription, maison: Cell[][], robot: RobotAspirator, robotName: string): void {

    console.log("RobotAspiratorComponent startAspiratorRobot robot");
    console.log(robot);
    // this.isRobotStarted = robot.isRobotStarted;
    this.basePosition = robot.basePosition;
    this.lastPositionInput = robot.lastPosition;
    this.positionInput = robot.position;
    this.batterie = robot.batterie;
    this.consommationParMouvement = robot.consommationParMouvement;

    // TODO: supprimer this.subscription ?
    this.subscription = new Subscription();

    this.subscription!.add(
      this.robotAspiratorService.onStartNettoyer(maison, robot).subscribe({
        next: (robotServiceData: RobotServiceDtoOut) => {

          // TODO: ajouter robotName :
          console.log('next startRobot...' + robot.robotName);
          this.log('next startRobot...' + robot.robotName);
          console.log(robotServiceData.positions[0].x.toString());
          console.log(robotServiceData.positions[0].y.toString());
          console.log(robotServiceData.positions[1].x.toString());
          console.log(robotServiceData.positions[1].y.toString());

          // TODO: variable Output pour renvoyer au parent AppComponent pour update de la Vue
          console.log('robot.position:', JSON.stringify(robot.position)); // Force la sérialisation immédiate
          console.log(robot);
          // copie par référence souhaitée ici:
          this.robotOutput = robot;
          console.log('robotOutput.position:', JSON.stringify(this.robotOutput.position));
          console.log(this.robotOutput);
          this.robotOutput.lastPosition = { ...robotServiceData.positions[0] };
          this.robotOutput.position = { ...robotServiceData.positions[1] };
          this.robotOutput.batterie = robotServiceData.batterie;

          this.updateRobot();
          // this.updateRobotView(robotName, lastPosition, position);
          // this.updateMaisonViewWithRobot(lastPosition);

          if (robotServiceData.positions[1].x === robot.basePosition.x && robotServiceData.positions[1].y === robot.basePosition.y) {
            this.log("arrivée à la base > unsubscribe");
          }
        },
        error: (err: string) => {
          this.log('Erreur onStartNettoyer: ' + err);
        },
        complete: () => {
          this.log('complete onStartNettoyer: ok !');
          // this.startIntro();
          // TODO: en test - SUPPRIMÉ car bug: si un robot est en panne, l'autre est à l'arrêt à l'ihm, mais le composant continue bien les appels de service:
          // this.subscription!.unsubscribe();

          if (robot.position.x === robot.basePosition.x && robot.position.y === robot.basePosition.y
            // && this.robot2?.position.x === this.robot2?.basePosition.x && this.robot2?.position.y === this.robot2?.basePosition.y
          ) {
            this.pauseRobot();
          }
        }
      })
    );
  }

  // lien du composant enfant > parent
  public updateRobot(): void {
    // console.log(this.robotOutput);
    this.robotUpdate.emit(this.robotOutput);
  }
}
