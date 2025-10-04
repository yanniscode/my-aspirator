import { Component, EventEmitter, OnDestroy, Output, ViewEncapsulation } from '@angular/core';

import { Subscription } from 'rxjs';

import { MessageService } from '../../services/message-service/message.service';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { CheminOptimalService } from '../../services/algo-services/chemin-optimal.service';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/robot-actions-service/robot-aspirator-with-next-positions-tab-service/robot-aspirator/robot-aspirator/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';
import { RobotAspiratorWithNextPositionService } from '../../services/robot-actions-service/robot-aspirator-with-next-position-service/robot-aspirator-with-next-position.service';
import { RobotServiceDtoOut } from '../../classes/dtos/robot-service-dto-out';

@Component({
  selector: 'app-robot-aspirator',
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  encapsulation: ViewEncapsulation.None,
  providers: [RobotAspiratorWithNextPositionsTabService, RobotAspiratorWithNextPositionService, CheminOptimalService] // Chaque instance aura son propre service
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  // public car appelée dans app-maison:
  public subscription?: Subscription;

  private maisonModel = new MaisonModel();

  // Variable @Output pour le composant parent
  @Output() robotUpdateModel: EventEmitter<RobotAspiratorModel> = new EventEmitter();
  // Variable robotOutputModel pour renvoyer au parent qui fait la mise à jour de la Vue
  private robotOutputModel: RobotAspiratorModel;

  // nécessaire pour l'animation (écoute d'observables avec rxjs)
  private updateSubscriptionNettoyer!: Subscription;
  // private updateSubscriptionRetourABase!: Subscription; // TODO supprimer

  ngOnDestroy(): void {
    this.robotOutputModel = this.robotAspiratorService.onPauseRobotService();
    if (this.subscription) {
      this.log("RobotAspiratorComponent - ngOnDestroy unsubscribe !");
      this.subscription.unsubscribe();
    }
  }

  constructor(private messageService: MessageService, private robotAspiratorService: RobotAspiratorWithNextPositionsTabService) {
    // this.robotModel = new RobotAspiratorModel();
    this.robotOutputModel = new RobotAspiratorModel();
  }

  public robotPause(): RobotAspiratorModel {
    console.log("RobotAspiratorComponent - robotPause");
    // V2:
    this.robotOutputModel = this.robotAspiratorService.onPauseRobotService();

    // V1 et V2:
    // console.log(this.subscription);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    // V1:
    // if (this.updateSubscriptionNettoyer) {
    //   this.updateSubscriptionNettoyer.unsubscribe();
    // }
    return this.robotOutputModel;
  }

  // // Impotation de l'algo V1 - test
  // public startRobot(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): RobotAspiratorModel {
  //   console.log("RobotAspiratorComponent - startRobot()");

  //   this.maisonModel = { ...maisonModelInput };
  //   console.log("this.maisonModel :");
  //   MaisonModel.logger(this.maisonModel);

  //   console.log("robotModelInput");
  //   RobotAspiratorModel.logger(robotModelInput);

  //   console.log("this.robotOutputModel avant modif :");
  //   RobotAspiratorModel.logger(this.robotOutputModel);
  //   this.robotOutputModel = { ...robotModelInput };
  //   console.log("this.robotOutputModel après modif :");
  //   RobotAspiratorModel.logger(this.robotOutputModel);

  //   // si on clique plusieurs fois sur start, la souscription existe et est ouverte, donc on ne resouscrit pas
  //   // ou bien : si on re-start après mise en pause, la souscription existe à l'état closed, on la réinitialise ici
  //   console.log(this.subscription);
  //   if (!this.subscription || this.subscription.closed) {
  //     this.subscription = new Subscription();

  //     // sous-appel de méthode, car :
  //     // un robot pourrait avoir d'autres spécialités que de passer l'aspi
  //     this.robotOutputModel = this.startAspiratorRobot();
  //   }
  //   return this.robotOutputModel;
  // }


  // ********************

  // Version Algo 2 - ok
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
      this.startAspiratorRobot();
    }
    return this.robotOutputModel;
  }

  // // algo V1 :
  // public startAspiratorRobot(): void {
  //   // si l'on préfère afficher le robot seulement après clic sur start:
  //   console.log("Début du nettoyage");

  //   // this.maisonModel = { ...maisonModelInput };

  //   // this.robotModel = { ...robotModelInput };
  //   // this.robotModel.isRobotStarted = true;

  //   if (!this.robotOutputModel.isRobotStarted) { // TODO: test
  //     return;
  //   }

  //   // algo principal de nettoyage de la maison
  //   this.subscription = this.robotAspiratorWithNextPositionService.nettoyer(this.maisonModel, this.robotOutputModel).subscribe({
  //     next: (robotOutputModel: RobotAspiratorModel) => {
  //       console.log("updateSubscriptionNettoyer next()");

  //       this.robotOutputModel = { ...robotOutputModel };
  //       // this.robotOutputModel.lastPosition = { ...robotOutputModel.lastPosition };
  //       // this.robotOutputModel.position = { ...robotOutputModel.position };
  //       // this.robotOutputModel.batterie = robotOutputModel.batterie;

  //       console.log(this.robotOutputModel.lastPosition.x.toString());
  //       console.log(this.robotOutputModel.lastPosition.y.toString());
  //       console.log(this.robotOutputModel.position.x.toString());
  //       console.log(this.robotOutputModel.position.y.toString());

  //       // Si le retour à la base n'est pas activé:
  //       if (!this.robotOutputModel.isRobotReturningToBase) {
  //         // MAJ de la vue:
  //         this.updateRobot();
  //       }
  //     },
  //     error: (err: string) => {
  //       console.log('Erreur nettoyer: ' + err);
  //     },
  //     complete: () => {
  //       console.log('complete nettoyer: Nettoyage ok !');

  //       this.subscription!.unsubscribe();
  //       // Retourner à la base de charge
  //       console.log(`Batterie: ${this.robotOutputModel.batterie}%. Retour à la base.`);

  //       this.robotOutputModel.isRobotReturningToBase = true;

  //       // puis on souscrit à retournerALaBase
  //       this.subscription = this.robotAspiratorWithNextPositionService.retournerALaBase(this.maisonModel, this.robotOutputModel).subscribe({
  //         next: (robotOutputModel: RobotAspiratorModel) => {
  //           console.log('next retournerALaBase...');

  //           this.robotOutputModel = { ...robotOutputModel };
  //           // this.robotOutputModel.lastPosition = { ...robotOutputModel.lastPosition };
  //           // this.robotOutputModel.position = { ...robotOutputModel.position };
  //           // this.robotOutputModel.batterie = robotOutputModel.batterie;

  //           console.log(this.robotOutputModel.lastPosition.x.toString());
  //           console.log(this.robotOutputModel.lastPosition.y.toString());
  //           console.log(this.robotOutputModel.position.x.toString());
  //           console.log(this.robotOutputModel.position.y.toString());

  //           // MAJ de la vue:
  //           this.updateRobot();
  //         },
  //         error: (err: string) => {
  //           console.log('Erreur retournerALaBase: ' + err);
  //         },
  //         complete: () => {
  //           console.log('complete retournerALaBase: ok !');
  //           this.robotOutputModel.isRobotStarted = false;
  //           // this.startIntro();
  //           this.subscription!.unsubscribe();

  //           if (this.robotOutputModel.position.x === this.robotOutputModel.basePosition.x && this.robotOutputModel.position.y === this.robotOutputModel.basePosition.y
  //           ) {
  //             this.robotOutputModel = this.robotPause();
  //           }
  //         }
  //       });
  //     }
  //   });

  //   return;
  // }



  // Algo V2 ok - méthode qui fait le lien avec le service du robot aspirateur
  private startAspiratorRobot(): RobotAspiratorModel {
    console.log("RobotAspiratorComponent startAspiratorRobot robot");

    this.subscription = this.robotAspiratorService.onStartNettoyer(this.maisonModel, this.robotOutputModel).subscribe({
      next: (robotServiceDtoOut: RobotServiceDtoOut) => {
        console.log('next startAspiratorRobot...');
        console.log("robotOutputModel avant modif:");
        RobotAspiratorModel.logger(this.robotOutputModel);
        // console.log('robotOutputModel.position:', JSON.stringify(this.robotOutputModel.position));

        // Vérification de la longueur du tableau
        if (robotServiceDtoOut!.positions.length === 0) {
          return;
        }

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

        RobotAspiratorModel.logger(this.robotOutputModel);

        // this.startIntro();

        this.subscription!.unsubscribe();

        if (this.robotOutputModel.position.x === this.robotOutputModel.basePosition.x && this.robotOutputModel.position.y === this.robotOutputModel.basePosition.y
        ) {
          this.robotPause();
        }
      }
    });

    return this.robotOutputModel;
  }

  // *************

  // v1 et v2:
  // lien du composant enfant > parent pour la vue
  public updateRobot(): void {
    // RobotAspiratorModel.logger(this.robotOutputModel);
    this.robotUpdateModel.emit(this.robotOutputModel);
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
