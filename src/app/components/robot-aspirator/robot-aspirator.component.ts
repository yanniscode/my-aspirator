import { Component, EventEmitter, OnDestroy, Output, ViewEncapsulation } from '@angular/core';

import { Subscription } from 'rxjs';

import { MessageService } from '../../services/message-service/message.service';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { RobotServiceDtoOut } from '../../classes/dtos/robot-service-dto-out';
import { MaisonModel } from '../../classes/models/maison-model';

@Component({
  selector: 'app-robot-aspirator',
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  encapsulation: ViewEncapsulation.None,
  providers: [RobotAspiratorService] // Chaque instance aura son propre service
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  // public car appelée dans app-maison:
  public subscription?: Subscription;

  // Variable @Output pour le composant parent
  @Output() robotUpdateModel: EventEmitter<RobotAspiratorModel> = new EventEmitter();
  // Variable robotOutputModel pour renvoyer au parent qui fait la mise à jour de la Vue
  private robotOutputModel: RobotAspiratorModel;
  private maisonModel = new MaisonModel();

  ngOnDestroy(): void {
    this.robotOutputModel = this.robotAspiratorService.onPauseRobotService();
    if (this.subscription) {
      this.log("RobotAspiratorComponent - ngOnDestroy unsubscribe !");
      this.subscription.unsubscribe();
    }
  }

  constructor(private messageService: MessageService, private robotAspiratorService: RobotAspiratorService) {
    this.robotOutputModel = new RobotAspiratorModel();
  }

  public robotPause(): RobotAspiratorModel {
    console.log("RobotAspiratorComponent - robotPause");
    this.robotOutputModel = this.robotAspiratorService.onPauseRobotService();

    // console.log(this.subscription);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    return this.robotOutputModel;
  }


  // ********************

  public startRobot(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): RobotAspiratorModel {
    console.log("RobotAspiratorComponent - startRobot()");

    this.maisonModel = { ...maisonModelInput };
    console.log("this.maisonModel :");
    MaisonModel.logger(this.maisonModel);

    console.log("robotModelInput");
    RobotAspiratorModel.logger(robotModelInput);

    console.log("this.robotOutputModel avant modif :");
    RobotAspiratorModel.logger(this.robotOutputModel);
    this.robotOutputModel = { ...robotModelInput };
    console.log("this.robotOutputModel après modif :");
    RobotAspiratorModel.logger(this.robotOutputModel);

    // si on clique plusieurs fois sur start, la souscription existe et est ouverte, donc on ne resouscrit pas
    // ou bien : si on re-start après mise en pause, la souscription existe à l'état closed, on la réinitialise ici
    console.log(this.subscription);
    if (!this.subscription || this.subscription.closed) {
      this.subscription = new Subscription();

      // sous-appel de méthode, car :
      // un robot pourrait avoir d'autres spécialités que de passer l'aspi
      this.robotOutputModel = this.startAspiratorRobot();
    }
    return this.robotOutputModel;
  }

  // méthode qui fait le lien avec le service du robot aspirateur
  private startAspiratorRobot(): RobotAspiratorModel {
    console.log("RobotAspiratorComponent startAspiratorRobot robot");
    // console.log(robotModel);

    this.subscription = this.robotAspiratorService.onStartNettoyer(this.maisonModel, this.robotOutputModel).subscribe({
      next: (robotServiceDtoOut: RobotServiceDtoOut) => {
        console.log('next startAspiratorRobot...');
        console.log("robotOutputModel avant modif:");
        RobotAspiratorModel.logger(this.robotOutputModel);

        // Vérification de la longueur du tableau
        if (robotServiceDtoOut!.positions.length === 0) {
          return;
        }

        // console.log('robotOutputModel.position:', JSON.stringify(this.robotOutputModel.position));

        this.robotOutputModel.lastPosition = { ...robotServiceDtoOut.positions[0] };
        this.robotOutputModel.position = { ...robotServiceDtoOut.positions[1] };
        this.robotOutputModel.batterie = robotServiceDtoOut.batterie;
        // this.robotOutputModel.isRobotStarted = robotServiceDtoOut.isRobotStarted;

        console.log("robotOutputModel après modif:");
        RobotAspiratorModel.logger(this.robotOutputModel);

        this.updateRobot();

        if (robotServiceDtoOut.positions[1].x === this.robotOutputModel.basePosition.x
          && robotServiceDtoOut.positions[1].y === this.robotOutputModel.basePosition.y) {
          this.log("arrivée à la base > unsubscribe");
        }
      },
      error: (err: string) => {
        this.log('Erreur onStartNettoyer: ' + err);
      },
      complete: () => {
        console.log('complete onStartNettoyer: ok !');
        // this.startIntro();
        // todo: en test avec :
        this.subscription!.unsubscribe();

        if (this.robotOutputModel.position.x === this.robotOutputModel.basePosition.x && this.robotOutputModel.position.y === this.robotOutputModel.basePosition.y
        ) {
          this.robotPause();
        }
      }
    });

    return this.robotOutputModel;
  }

  // lien du composant enfant > parent
  public updateRobot(): void {
    // console.log(this.robotOutputModel);
    this.robotUpdateModel.emit(this.robotOutputModel);
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
