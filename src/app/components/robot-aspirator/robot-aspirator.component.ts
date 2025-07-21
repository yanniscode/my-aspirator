import { Component, OnDestroy } from '@angular/core';
import { AppComponent } from '../app.component';
import { finalize, Observable, Subject, Subscriber, Subscription, takeUntil, tap } from 'rxjs';
import { Position } from '../../classes/position';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { RobotServiceData } from '../../classes/RobotServiceData';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-robot-aspirator',
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css'
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  private messageService: MessageService;

  private robotAspiratorService: RobotAspiratorService;

  // Position actuelle
  private position: Position;
  private lastPosition: Position;
  private isRobotStarted: boolean;

  // Niveau de batterie (en pourcentage)
  public batterie: number;
  // TODO : voir si on garde:
  // public getBatterie() {
  //   return this.batterie;
  // }
  // public setBatterie(batterie : number) {
  //   return this.batterie = batterie;
  // }
  // Combien d'énergie est consommée par mouvement
  public consommationParMouvement: number;

  constructor(messageService: MessageService) {
    // this.subscription = new Subscription();
    this.messageService = messageService;

    this.robotAspiratorService = new RobotAspiratorService(this.messageService);

    // TODO: basePosition à modifier en non static, si plusieurs robots présents
    this.position = { ...AppComponent.basePosition };
    this.lastPosition = { ...AppComponent.basePosition };
    this.batterie = 5;

    this.isRobotStarted = false;
    // this.energieRetourBase = 0; // Sera calculée dynamiquement
    // Combien d'énergie est consommée par mouvement
    this.consommationParMouvement = 0.5;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }

  public pauseRobot(): void {
    this.isRobotStarted = false;

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.robotAspiratorService.onPause();
  }

  // Fonction principale pour nettoyer la maison
  public onStartNettoyer(): Observable<Position[]> {

    return new Observable<Position[]>((observer) => {
      if (!this.subscription || this.subscription.closed) {
        this.log("onStartNettoyer new subscription !")
        this.subscription = new Subscription();

        this.robotAspiratorService = new RobotAspiratorService(this.messageService);

        this.subscription!.add(
          this.robotAspiratorService.robotPosition$.subscribe(update => {
            // console.log('Robot moved:', update.current, 'from:', update.last);
            // Mettre à jour l'affichage du robot si nécessaire
          })
        );
      }

      this.isRobotStarted = true;

      // en cas de mise en pause
      if (!this.isRobotStarted) {
        observer.complete();
        return;
      }

      // Méthode principale de nettoyage de la maison
      this.isRobotStarted = true;
      this.nettoyerAvecControleSouscription(observer);
    });
  }

  private nettoyerAvecControleSouscription(observer: Subscriber<Position[]>): void {
    this.log("Début du nettoyage");
    this.log(`Batterie: ${this.batterie}%.`);

    const stopNettoyer$ = new Subject<void>();

    this.subscription!.add(
      this.robotAspiratorService.nettoyerAvecControle(
        false,  // isRetourAlaBase = false
        this.position,
        this.lastPosition,
        this.batterie,
        this.isRobotStarted,
        this.consommationParMouvement
      ).pipe(
        takeUntil(stopNettoyer$),
        tap((robotServiceData: RobotServiceData) => {
          this.log('*** next nettoyerAvecControleSouscription...');
          console.log(robotServiceData);
          this.batterie = robotServiceData!.batterie;

          if (robotServiceData!.isNettoyageComplete === true) {
            this.log('Nettoyage terminé !');
            stopNettoyer$.next(); // Déclenche l'arrêt
            return;
          } else if (this.batterie <= this.robotAspiratorService.energieNecessairePourRetour(this.position, this.consommationParMouvement)) {
            this.log("Batterie insuffisante : retour à la base de charge nécessaire...");
            stopNettoyer$.next(); // Déclenche l'arrêt
            return;
          } else {
            // Continuer le nettoyage
            this.lastPosition = { x: robotServiceData!.positions[0].x, y: robotServiceData!.positions[0].y };
            this.position = { x: robotServiceData!.positions[1].x, y: robotServiceData!.positions[1].y };
            this.log("this.batterie = " + this.batterie.toString());
            this.log("this.lastPosition.x = " + this.lastPosition.x.toString());
            this.log("this.lastPosition.y =" + this.lastPosition.y.toString());
            this.log("this.position.x = " + this.position.x.toString());
            this.log("this.position.y = " + this.position.y.toString());

            try {
              observer.next([this.lastPosition, this.position]);
            } catch (error) {
              console.error("Erreur lors de l'émission de la position:", error);
            }
          }
        }),
        finalize(() => {
          // Ce bloc s'exécute UNE SEULE FOIS à la fin
          this.log("*********");
          this.log('complete nettoyer: Nettoyage ok ou batterie insuffisante !');
          this.retournerALaBaseSouscription(observer);
          stopNettoyer$.complete(); // Nettoyer le Subject
        })
      ).subscribe({
        error: (err: string) => {
          this.log('Erreur nettoyer: ' + err);
          stopNettoyer$.complete(); // Nettoyer le Subject même en cas d'erreur
        }
      })
    );
  }

  private retournerALaBaseSouscription(observer: Subscriber<Position[]>): void {
    this.log("Retour à la base");
    this.log(`Batterie: ${this.batterie}%. Retour à la base.`);

    this.subscription!.add(
      this.robotAspiratorService.nettoyerAvecControle(
        true, // isRetourAlaBase = true
        this.position,
        this.lastPosition,
        this.batterie,
        this.isRobotStarted,
        this.consommationParMouvement
      ).subscribe({
        next: (robotServiceData: RobotServiceData) => {
          this.log('next retournerALaBaseSouscription...');

          console.log(robotServiceData);

          this.batterie = robotServiceData!.batterie;
          if(this.batterie <= 0) {
            this.log('Batterie à plat ! Robot en panne...');
            this.subscription!.unsubscribe();
            observer.complete();
            return;
          }

          if (robotServiceData.positions.length === 0) {
            this.log('Chemin de retour vide');
            this.subscription!.unsubscribe();
            observer.complete();
            return;
          }

          this.lastPosition = { x: robotServiceData!.positions[0].x, y: robotServiceData!.positions[0].y };
          this.position = { x: robotServiceData!.positions[1].x, y: robotServiceData!.positions[1].y };

          this.log("this.batterie = " + this.batterie.toString());
          this.log(this.lastPosition.x.toString());
          this.log(this.lastPosition.y.toString());
          this.log(this.position.x.toString());
          this.log(this.position.y.toString());


          // // TODO: À REVOIR
          // if (this.position.x === AppComponent.basePosition.x && this.position.y === AppComponent.basePosition.y ) {
          //   AppComponent.log("RobotComponent Arrivée à la base ok !");
          //   this.isRobotStarted = false;
          //   observer.next([this.lastPosition, this.position]);
          //   // return;
          // }          // // TODO: À REVOIR
          // if (this.position.x === AppComponent.basePosition.x && this.position.y === AppComponent.basePosition.y ) {
          //   AppComponent.log("RobotComponent Arrivée à la base ok !");
          //   this.isRobotStarted = false;
          //   observer.next([this.lastPosition, this.position]);
          //   // return;
          // }

          observer.next([this.lastPosition, this.position]);
        },
        error: (err: string) => {
          this.log('Erreur retournerALaBase: ' + err);
        },
        complete: () => {
          this.log('complete retournerALaBase: ok !');
          this.isRobotStarted = false;
          observer.complete();
        }
      })
    );
  }

}
