import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../../services/message.service';
import { Cell } from '../../classes/cell';
import { Position } from '../../classes/position';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { RobotAspiratorModel } from '../../classes/robot-aspirator-model';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true, // Composant autonome
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css'
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

  @Output() robotUpdate: EventEmitter<RobotAspiratorModel> = new EventEmitter();
  private robotOutput: RobotAspiratorModel;

  // le robot peut être initialisé ou non
  // private robot1?: RobotAspiratorComponent;
  // private robot1?: RobotAspiratorComponent;
  // private robot2?: RobotAspiratorComponent;

  // Combien d'énergie est consommée par mouvement
  public consommationParMouvement: number;

  // private isRobotStarted: boolean;

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.log("RobotAspiratorComponent - ngOnDestroy unsubscribe !");
      this.subscription.unsubscribe();
    }
    // this.robotAspiratorService.onPause();
  }
  // remplace ngOnDestroy car ce n'est pas un composant Angular mais une Classe, ici:
  // public destroy(): void {
  //   // this.isRobotStarted = false;
  //   if (this.subscription) {
  //     this.subscription.unsubscribe();
  //   }
  //   this.robotAspiratorService.onPause();
  // }

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

    this.robotOutput = new RobotAspiratorModel();
  }

  public pauseRobot(): void {
    // this.isRobotStarted = false;
    this.robotOutput.isRobotStarted = false;
    
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.robotAspiratorService.onPause();
  }


  // ********************

  public startRobot(maison: Cell[][], robot: RobotAspiratorModel): void {
    // A l'intro, pas de souscription, donc on l'initialise ici
    // si on clique plusieurs fois sur start, la souscription existe, et est ouverte, donc on ne resouscrit pas
    // si on restart après mise en pause, la souscription existe à l'état closed, on la réinitialise ici
    if (!this.subscription || this.subscription.closed) {
      this.startAspiratorRobot(maison, robot);
      // this.robotAspiratorService.addRobotToSubscription(maison, robot2, "robot2");
    }
  }

  private startAspiratorRobot(maison: Cell[][], robot: RobotAspiratorModel) {
    // public addRobotToSubscription(subscription: Subscription, maison: Cell[][], robot: RobotAspiratorModel, robotName: string): void {

    console.log("addRobotToSubscription robot");
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
        next: ([lastPosition, position]: Position[]) => {

          // TODO: ajouter robotName :
          console.log('next startRobot...' + robot.robotName);
          this.log('next startRobot...' + robot.robotName);
          console.log(lastPosition.x.toString());
          console.log(lastPosition.y.toString());
          console.log(position.x.toString());
          console.log(position.y.toString());

          // TODO: variable Output pour renvoyer au parent AppComponent pour update de la Vue
          this.robotOutput = { ...robot };
          this.robotOutput.lastPosition = { ...lastPosition };
          this.robotOutput.position = { ...position };
          
          this.updateRobot();
          // this.updateRobotView(robotName, lastPosition, position);
          // this.updateMaisonViewWithRobot(lastPosition);

          if (position.x === robot.basePosition.x && position.y === robot.basePosition.y) {
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

  public updateRobot(): void {
    console.log(this.robotOutput);
    this.robotUpdate.emit(this.robotOutput);
  }  
}
