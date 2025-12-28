import { ChangeDetectionStrategy, Component, inject, OnDestroy, ViewEncapsulation } from '@angular/core';

import { MessageService } from '../../services/message-service/message.service';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { CheminOptimalService } from '../../services/algo-services/chemin-optimal.service';
import { RobotAspiratorWithNextPositionsTabService } from '../../services/robot-actions-service/robot-aspirator-with-next-positions-tab-service/robot-aspirator/robot-aspirator/robot-aspirator-with-next-positions-tab-service/robot-aspirator-with-next-positions-tab.service';
import { RobotAspiratorDataService } from '../../services/robot-aspirator-data-service/robot-aspirator-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  providers: [RobotAspiratorWithNextPositionsTabService, CheminOptimalService] // Chaque instance aura son propre service
})
export class RobotAspiratorComponent implements OnDestroy {

  private messageService: MessageService;

  // TODO: garder pour version Algo 2 ?
  // private robotAspiratorWithNextPositionsTabService: RobotAspiratorWithNextPositionsTabService;

  private maisonModel: MaisonModel;

  // TODO: garder jusqu'au refacto du service 2:
  // Variable robotOutputModel pour renvoyer au parent qui fait la mise à jour de la Vue

  //  Alternative: on peut appeler le service de recherche 1 robotAspiratorWithNextPositionService ou service 2 RobotAspiratorWithNextPositionsTabService :
  //  le service 1 permet au robot de trouver sa position suivante et réitère la recherche de case à nettoyer à chaque tour
  //  (préférable si plusieurs robots pour éviter qu'ils ne prennent le même chemin)
  //  le service 2 ne réitère la recherche de nouvelle position à nettoyer qu'après avoir été jusqu'à sa prochaine case à nettoyer (préférable si le robot est seul)
  //  TODO:
  // revoir l'algo car cela ne suffit pas : les robots continuent de se suivre > option à voir: créer un paramètre case réservée dans la maison
  constructor() {
    console.log("RobotAspiratorComponent - constructor()");

    this.messageService = inject(MessageService);

    // TODO: garder pour service Algo 2:
    // this.robotAspiratorWithNextPositionsTabService = inject(RobotAspiratorWithNextPositionsTabService);
    // this.robotOutputModel = new RobotAspiratorModel();

    this.maisonModel = new MaisonModel();
  }

  ngOnDestroy(): void {
    console.log("RobotAspiratorComponent - ngOnDestroy()");

    // Appel du service 2 RobotAspiratorWithNextPositionsTabService :
    // this.robotOutputModel = this.robotAspiratorWithNextPositionsTabService.onPauseRobotService();
  }

  public robotPauseV1(): void {
    console.log("RobotAspiratorComponent - robotPauseV1()");
    // TODO: appel du service onRobotPause()
    // this.robotAspiratorDataService.onRobotPause();
  }

  // TODO: garder pour service Algo 2:
  // public robotPauseV2(): RobotAspiratorModel {
  //   console.log("RobotAspiratorComponent - robotPauseV2()");
  //   // Appel du service 2 RobotAspiratorWithNextPositionsTabService :
  //   this.robotOutputModel = this.robotAspiratorWithNextPositionsTabService.onPauseRobotService();
  //   // console.log(this.subscription);
  //   if (this.subscription) {
  //     this.subscription.unsubscribe();
  //   }
  //   return this.robotOutputModel;
  // }

  // ********************

  // TODO: garder pour service Algo 2:
  // public startRobot(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): void {
  //   console.log("RobotAspiratorComponent - startRobot()");

  //   // TODO: revoir si trop de copies de la maison:
  //   this.maisonModel = { ...maisonModelInput };
  //   console.log("this.maisonModel :");
  //   MaisonModel.logger(this.maisonModel);

  //   const robotOutputModel: RobotAspiratorModel = { ...robotModelInput };
  //   console.log("robotOutputModel après modif :");
  //   RobotAspiratorModel.logger(robotOutputModel);

  //   // sous-appel de méthode, car :
  //   // un robot pourrait avoir d'autres spécialités que de passer l'aspi
  //   this.startRobotAspiratorWithNextPositionService(robotOutputModel);
  // }

  // TODO: à supprimer car pour service Algo 1 > Observables devenues Signals :
  // Algo V1 ok - méthode qui fait le lien avec le service 1 du robot aspirateur
  // private startRobotAspiratorWithNextPositionService(robotOutputModel: RobotAspiratorModel): void {
  //   console.log("RobotAspiratorComponent - startRobotAspiratorWithNextPositionService()");

  //   // si l'on préfère afficher le robot seulement après clic sur start:
  //   console.log("Début du nettoyage");
  //   if (!robotOutputModel.isRobotStarted) { // TODO: test
  //     return;
  //   }

  //   // algo principal de nettoyage de la maison
  //   console.log("robotAspiratorWithNextPositionService.nettoyer()");
  //   // TODO: supprimer ici > appel direct dans le service: updateAllRobots()
  //   // this.robotAspiratorDataService.nettoyer(this.maisonModel, robotOutputModel);

  //   // console.log(this.robotOutputModel.lastPosition.x.toString());
  //   // console.log(this.robotOutputModel.lastPosition.y.toString());
  //   // console.log(this.robotOutputModel.position.x.toString());
  //   // console.log(this.robotOutputModel.position.y.toString());

  //   // TODO: setter dans le service ?
  //   if (robotOutputModel.isRobotReturningToBase) {
  //     // Retourner à la base de charge
  //     console.log(`Batterie: ${robotOutputModel.batterie}%. Retour à la base.`);

  //     // TODO: TESTER APPEL À PARTIR d'un effect(), ici:
  //     // puis on souscrit à retournerALaBase
  //     // console.log('robotAspiratorWithNextPositionService.retournerALaBase()');
  //     // this.robotAspiratorWithNextPositionService.retournerALaBase(maisonModel, robotOutputModel);

  //     // TODO: setter dans le service ?
  //     robotOutputModel.isRobotStarted = false;

  //     // TODO utiliser dans le service ?
  //     if (robotOutputModel.position.x === robotOutputModel.basePosition.x && robotOutputModel.position.y === robotOutputModel.basePosition.y
  //     ) {
  //       this.robotPauseV1();
  //     }
  //   }
  // }

  // TODO: garder pour service Algo 2:
  // Algo V2 ok - méthode qui fait le lien avec le service 2 du robot aspirateur
  // private startRobotAspiratorWithNextPositionsTabService(): RobotAspiratorModel {
  //   console.log("RobotAspiratorComponent - startRobotAspiratorWithNextPositionsTabService()");

  //   // Appel du service 2 RobotAspiratorWithNextPositionsTabService :
  //   this.subscription = this.robotAspiratorWithNextPositionsTabService.onStartNettoyer(this.maisonModel, this.robotOutputModel).subscribe({
  //     next: (robotServiceDtoOut: RobotServiceDtoOut) => {
  //       console.log('next startAspiratorRobot...');
  //       console.log("robotOutputModel avant modif:");
  //       RobotAspiratorModel.logger(this.robotOutputModel);
  //       // console.log('robotOutputModel.position:', JSON.stringify(this.robotOutputModel.position));

  //       // Vérification de la longueur du tableau
  //       if (robotServiceDtoOut!.positions.length === 0) {
  //         return;
  //       }

  //       this.robotOutputModel.lastPosition = { ...robotServiceDtoOut.positions[0] };
  //       this.robotOutputModel.position = { ...robotServiceDtoOut.positions[1] };
  //       this.robotOutputModel.batterie = robotServiceDtoOut.batterie;
  //       // this.robotOutputModel.isRobotStarted = robotServiceDtoOut.isRobotStarted;

  //       console.log("robotOutputModel après modif:");
  //       RobotAspiratorModel.logger(this.robotOutputModel);

  //       // this.updateRobot();

  //       if (robotServiceDtoOut.positions[1].x === this.robotOutputModel.basePosition.x
  //         && robotServiceDtoOut.positions[1].y === this.robotOutputModel.basePosition.y) {
  //         this.log("arrivée à la base > unsubscribe");
  //       }
  //     },
  //     error: (err: string) => {
  //       this.log('Erreur onStartNettoyer: ' + err);
  //     },
  //     complete: () => {
  //       console.log('complete onStartNettoyer: ok !');

  //       RobotAspiratorModel.logger(this.robotOutputModel);

  //       // this.startIntro();

  //       this.subscription!.unsubscribe();

  //       if (this.robotOutputModel.position.x === this.robotOutputModel.basePosition.x && this.robotOutputModel.position.y === this.robotOutputModel.basePosition.y
  //       ) {
  //         this.robotPauseV2();
  //       }
  //     }
  //   });
  //   return this.robotOutputModel;
  // }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
