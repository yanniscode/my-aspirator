import { Component, Input, OnDestroy } from '@angular/core';
import { finalize, Observable, Subject, Subscriber, Subscription, takeUntil, tap } from 'rxjs';
import { Position } from '../../classes/position';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { RobotServiceData } from '../../classes/RobotServiceData';
import { MessageService } from '../../services/message.service';
import { Cell } from '../../classes/cell';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true, // Composant autonome
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css'
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  private messageService: MessageService;

  private robotAspiratorService: RobotAspiratorService;

  // Position actuelle
  @Input() lastPosition: Position;
  @Input() position: Position;
  // Niveau de batterie (en pourcentage)
  @Input() batterie: number;

  public basePosition: Position;

  private isRobotStarted: boolean;

  // Combien d'énergie est consommée par mouvement
  public consommationParMouvement: number;

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }

  constructor(messageService: MessageService) {
    // this.subscription = new Subscription();
    this.messageService = messageService;

    this.robotAspiratorService = new RobotAspiratorService(this.messageService);

    // valeurs par défaut pour l'init du robot:
    this.basePosition = { x: -1, y: -1 };
    this.lastPosition = { ...this.basePosition };
    this.position = { ...this.basePosition };
    this.batterie = -1;

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

  public pauseRobot(): void {
    this.isRobotStarted = false;

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.robotAspiratorService.onPause();
  }

  // Fonction principale pour nettoyer la maison
  public onStartNettoyer(maison: Cell[][]): Observable<Position[]> {

    return new Observable<Position[]>((observer) => {
      if (!this.subscription || this.subscription.closed) {
        this.log("onStartNettoyer new subscription !")
        this.subscription = new Subscription();

        this.robotAspiratorService = new RobotAspiratorService(this.messageService);

        this.subscription!.add(
          this.robotAspiratorService.robotPosition$.subscribe()
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
      this.nettoyerAvecControleSouscription(maison, observer);
    });
  }

  private nettoyerAvecControleSouscription(maison: Cell[][], observer: Subscriber<Position[]>): void {
    this.log("Début du nettoyage");
    this.log(`Batterie: ${this.batterie}%.`);

    const stopNettoyer$ = new Subject<void>();

    this.subscription!.add(
      this.robotAspiratorService.nettoyerAvecControle(
        false,  // isRetourAlaBase = false
        maison,
        this.basePosition,
        this.position,
        this.batterie,
        this.isRobotStarted,
        this.consommationParMouvement
      ).pipe(
        takeUntil(stopNettoyer$), // L'Observable continue jusqu'à ce que stopNettoyer$ émette
        tap((robotServiceData: RobotServiceData) => {

          this.log('*** next nettoyerAvecControleSouscription...');
          console.log(robotServiceData);

          if (!robotServiceData.positions.length) {
            this.log('*** Aucun chemin trouvé ***');
            stopNettoyer$.next(); // Déclenche l'arrêt
            return;
          }
          else if (robotServiceData!.isNettoyageComplete === true) {
            this.log('Nettoyage terminé !');
            stopNettoyer$.next();
            return;
          }
          else if (robotServiceData!.positions.length && robotServiceData!.batterie <= this.robotAspiratorService.energieNecessairePourRetour(this.basePosition, robotServiceData!.positions[1], this.consommationParMouvement)) {
            this.log("Batterie insuffisante : retour à la base de charge nécessaire...");
            stopNettoyer$.next();
            return;
          }

          // Continuer le nettoyage
          this.lastPosition = { x: robotServiceData!.positions[0]!.x, y: robotServiceData!.positions[0]!.y };
          this.position = { x: robotServiceData!.positions[1]!.x, y: robotServiceData!.positions[1]!.y };
          this.batterie = robotServiceData!.batterie;

          this.log("this.lastPosition.x = " + this.lastPosition.x.toString());
          this.log("this.lastPosition.y =" + this.lastPosition.y.toString());
          this.log("this.position.x = " + this.position.x.toString());
          this.log("this.position.y = " + this.position.y.toString());
          this.log("this.batterie =" + this.batterie.toString());
          this.log("Energie nécessaire au retour =" + this.robotAspiratorService.energieNecessairePourRetour(this.basePosition, robotServiceData?.positions[1], this.consommationParMouvement).toString());

          try {
            observer.next([this.lastPosition, this.position]);
          } catch (error) {
            this.log("Erreur lors de l'émission de la position: " + error);
          }
        }),
        finalize(() => {
          // Ce bloc s'exécute UNE SEULE FOIS à la fin
          this.log('complete nettoyerAvecControleSouscription: Nettoyage ok ou batterie insuffisante !');
          this.retournerALaBaseSouscription(maison, observer);
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

  private retournerALaBaseSouscription(maison: Cell[][], observer: Subscriber<Position[]>): void {

    this.log("Retour à la base");
    this.log(`Batterie: ${this.batterie}%. Retour à la base.`);

    this.subscription!.add(
      this.robotAspiratorService.nettoyerAvecControle(
        true, // isRetourAlaBase = true
        maison,
        this.basePosition,
        this.position,
        this.batterie,
        this.isRobotStarted,
        this.consommationParMouvement
      ).subscribe({
        next: (robotServiceData: RobotServiceData) => {

          this.log('next retournerALaBaseSouscription...');
          console.log(robotServiceData);

          if (!robotServiceData!.positions.length) {
            this.log('*** Aucun chemin trouvé ***');
            this.subscription!.unsubscribe();
            observer.complete();
            return;
          }
          else if (robotServiceData!.batterie <= 0) {
            this.log('Batterie à plat ! Robot en panne...');
            this.subscription!.unsubscribe();
            observer.complete();
            return;
          }

          // Continuer le retour à la base
          this.lastPosition = { x: robotServiceData!.positions[0]!.x, y: robotServiceData!.positions[0]!.y };
          this.position = { x: robotServiceData!.positions[1]!.x, y: robotServiceData!.positions[1]!.y };
          this.batterie = robotServiceData!.batterie;

          this.log("this.lastPosition.x = " + this.lastPosition.x.toString());
          this.log("this.lastPosition.y =" + this.lastPosition.y.toString());
          this.log("this.position.x = " + this.position.x.toString());
          this.log("this.position.y = " + this.position.y.toString());
          this.log("this.batterie =" + this.batterie.toString());
          this.log("Energie nécessaire au retour =" + this.robotAspiratorService.energieNecessairePourRetour(this.basePosition, robotServiceData?.positions[1], this.consommationParMouvement).toString());

          try {
            observer.next([this.lastPosition, this.position]);
          } catch (error) {
            this.log("Erreur lors de l'émission de la position: " + error);
          }

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
