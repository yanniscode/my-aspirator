import { Component, EventEmitter, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../../services/message-service/message.service';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { RobotServiceDtoOut } from '../../classes/dtos/robot-service-dto-out';
import { MaisonModel } from '../../classes/models/maison-model';

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

  // variable @Output pour le composant parent
  @Output() robotUpdateModel: EventEmitter<RobotAspiratorModel> = new EventEmitter();
  private robotOutputModel: RobotAspiratorModel;

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
    this.robotOutputModel = new RobotAspiratorModel();
  }

  public robotPause(): void {
    this.robotAspiratorService.onPause();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.robotOutputModel.isRobotStarted = false;
  }


  // ********************

  public startRobot(maisonModel: MaisonModel, robotModel: RobotAspiratorModel): void {

    console.log("startRobot");
    console.log(robotModel);

    // si on clique plusieurs fois sur start, la souscription existe et est ouverte, donc on ne resouscrit pas
    // ou bien : si on re-start après mise en pause, la souscription existe à l'état closed, on la réinitialise ici
    // TODO: condition
    if (!this.subscription || this.subscription.closed) {
      this.subscription = new Subscription();

      // sous-appel de méthode, car :
      // un robot pourrait avoir d'autres spécialités que de passer l'aspi
      this.startAspiratorRobot(maisonModel, robotModel);
    }
  }

  // méthode qui fait le lien avec le service du robot aspirateur
  private startAspiratorRobot(maisonModel: MaisonModel, robotModel: RobotAspiratorModel): void {
    console.log("RobotAspiratorComponent startAspiratorRobot robot");
    console.log(robotModel);

    this.subscription!.add(
      this.robotAspiratorService.onStartNettoyer(maisonModel, robotModel).subscribe({
        next: (robotServiceDtoOut: RobotServiceDtoOut) => {

          this.log('next startRobot...' + robotModel.robotName);
          console.log('next startRobot...' + robotModel.robotName);

          console.log(robotServiceDtoOut.positions[0].x.toString());
          console.log(robotServiceDtoOut.positions[0].y.toString());
          console.log(robotServiceDtoOut.positions[1].x.toString());
          console.log(robotServiceDtoOut.positions[1].y.toString());

          console.log('robot.position:', JSON.stringify(robotModel.position)); // Force la sérialisation immédiate pour logger
          console.log(robotModel);

          // Variable robotOutputModel pour renvoyer au parent MaisonComponent qui fait la mise à jour de la Vue
          // copie par référence souhaitée ici:
          this.robotOutputModel = robotModel;

          console.log('robotOutputModel.position:', JSON.stringify(this.robotOutputModel.position));
          console.log(this.robotOutputModel);
          this.robotOutputModel.lastPosition = { ...robotServiceDtoOut.positions[0] };
          this.robotOutputModel.position = { ...robotServiceDtoOut.positions[1] };
          this.robotOutputModel.batterie = robotServiceDtoOut.batterie;

          this.updateRobot();

          if (robotServiceDtoOut.positions[1].x === robotModel.basePosition.x && robotServiceDtoOut.positions[1].y === robotModel.basePosition.y) {
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

          // TODO: revoir mise en pause: après modifs, si l'un est revenu à la base, l'autre est mis à l'arrêt
          if (robotModel.position.x === robotModel.basePosition.x && robotModel.position.y === robotModel.basePosition.y
            // && this.robot2?.position.x === this.robot2?.basePosition.x && this.robot2?.position.y === this.robot2?.basePosition.y
          ) {
            this.robotPause();
          }
        }
      })
    );
    console.log(this.subscription);
  }

  // lien du composant enfant > parent
  public updateRobot(): void {
    // console.log(this.robotOutputModel);
    this.robotUpdateModel.emit(this.robotOutputModel);
  }
}
