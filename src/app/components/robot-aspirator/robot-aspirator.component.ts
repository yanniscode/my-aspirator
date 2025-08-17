import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../../services/message.service';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { RobotAspirator } from '../../classes/models/robot-aspirator';
import { RobotServiceDtoOut } from '../../classes/dtos/robot-service-dto-out';
import { Maison } from '../../classes/models/maison';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true, // Composant autonome
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  encapsulation: ViewEncapsulation.None
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  // public car appelée dans app-maison:
  public subscription?: Subscription;

  @Output() robotUpdate: EventEmitter<RobotAspirator> = new EventEmitter();
  private robotOutput: RobotAspirator;

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
    this.robotOutput = new RobotAspirator();
  }

  public pauseRobot(): void {
    this.robotAspiratorService.onPause();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.robotOutput.isRobotStarted = false;
  }


  // ********************

  public startRobot(maison: Maison, robot: RobotAspirator): void {

    console.log("startRobot");
    // A l'intro, pas de souscription, donc on l'initialise ici

    // si on clique plusieurs fois sur start, la souscription existe et est ouverte, donc on ne resouscrit pas
    // si on re-start après mise en pause, la souscription existe à l'état closed, on la réinitialise ici
    // TODO: condition
    if (!this.subscription || this.subscription.closed) {
      this.subscription = new Subscription();

      // sous-appel de méthode, car à l'avenir:
      // un robot pourrait avoir d'autres spécialités que de passer l'aspi
      this.startAspiratorRobot(maison, robot);
    }
  }

  // méthode qui fait le lien avec le service du robot aspirateur
  private startAspiratorRobot(maison: Maison, robot: RobotAspirator): void {
    // public addRobotToSubscription(subscription: Subscription, maison: Maison, robot: RobotAspirator, robotName: string): void {

    console.log("RobotAspiratorComponent startAspiratorRobot robot");
    console.log(robot);
    this.subscription!.add(
      this.robotAspiratorService.onStartNettoyer(maison, robot).subscribe({
        next: (robotServiceDtoOut: RobotServiceDtoOut) => {

          // TODO: ajouter robotName :
          console.log('next startRobot...' + robot.robotName);
          this.log('next startRobot...' + robot.robotName);
          console.log(robotServiceDtoOut.positions[0].x.toString());
          console.log(robotServiceDtoOut.positions[0].y.toString());
          console.log(robotServiceDtoOut.positions[1].x.toString());
          console.log(robotServiceDtoOut.positions[1].y.toString());

          // TODO: variable Output pour renvoyer au parent AppComponent pour update de la Vue
          console.log('robot.position:', JSON.stringify(robot.position)); // Force la sérialisation immédiate
          console.log(robot);
          // copie par référence souhaitée ici:
          this.robotOutput = robot;
          console.log('robotOutput.position:', JSON.stringify(this.robotOutput.position));
          console.log(this.robotOutput);
          this.robotOutput.lastPosition = { ...robotServiceDtoOut.positions[0] };
          this.robotOutput.position = { ...robotServiceDtoOut.positions[1] };
          this.robotOutput.batterie = robotServiceDtoOut.batterie;

          this.updateRobot();

          if (robotServiceDtoOut.positions[1].x === robot.basePosition.x && robotServiceDtoOut.positions[1].y === robot.basePosition.y) {
            this.log("arrivée à la base > unsubscribe");
          }
        },
        error: (err: string) => {
          this.log('Erreur onStartNettoyer: ' + err);
        },
        complete: () => {
          this.log('complete onStartNettoyer: ok !');
          // this.startIntro();
          // TODO: en test - SUPPRIMÉ car bug: si un robot est en panne, l'autre est à l'arrêt à l'ihm,
          // mais le composant continue bien les appels de service:
          // this.subscription!.unsubscribe();

          // TODO: revoir miise en pause: après modifs, si l'un est revenu à la base, l'autre est mis à l'arrêt
          if (robot.position.x === robot.basePosition.x && robot.position.y === robot.basePosition.y
            // && this.robot2?.position.x === this.robot2?.basePosition.x && this.robot2?.position.y === this.robot2?.basePosition.y
          ) {
            this.pauseRobot();
          }
        }
      })
    );
    console.log(this.subscription);
  }

  // lien du composant enfant > parent
  public updateRobot(): void {
    // console.log(this.robotOutput);
    this.robotUpdate.emit(this.robotOutput);
  }
}
