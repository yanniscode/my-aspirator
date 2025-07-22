import { Component, OnDestroy } from '@angular/core';
import { AppComponent } from '../app.component';
import { finalize, Observable, Subject, Subscriber, Subscription, takeUntil, tap } from 'rxjs';
import { Position } from '../../classes/position';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { RobotServiceData } from '../../classes/RobotServiceData';

@Component({
  selector: 'app-robot-aspirator',
  imports: [],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css'
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;
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

  constructor() {
    // this.subscription = new Subscription();
    this.robotAspiratorService = new RobotAspiratorService();

    // TODO: basePosition à modifier en non static, si plusieurs robots présents
    this.position = { ...AppComponent.basePosition };
    this.lastPosition = { ...AppComponent.basePosition };
    this.batterie = 50;

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
  public onStartNettoyer(): Observable<Position[]> {

    return new Observable<Position[]>((observer) => {
      if (!this.subscription || this.subscription.closed) {
        console.log("RobotAspiratorComponent onStartNettoyer new subscription !")
        this.subscription = new Subscription();

        this.robotAspiratorService = new RobotAspiratorService();

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
    AppComponent.log("Début du nettoyage");
    AppComponent.log(`Batterie: ${this.batterie}%.`);

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
          AppComponent.log('*** RobotAspiratorComponent next nettoyerAvecControleSouscription...');
          console.log(robotServiceData);
          this.batterie = robotServiceData!.batterie;

          if (robotServiceData!.isNettoyageComplete === true) {
            AppComponent.log('RobotAspiratorComponent Nettoyage terminé !');
            stopNettoyer$.next(); // Déclenche l'arrêt
            return;
          } else if (this.batterie <= this.robotAspiratorService.energieNecessairePourRetour(this.position, this.consommationParMouvement)) {
            AppComponent.log("RobotAspiratorComponent Batterie insuffisante : retour à la base de charge nécessaire...");
            stopNettoyer$.next(); // Déclenche l'arrêt
            return;
          } else {
            // Continuer le nettoyage
            this.lastPosition = { x: robotServiceData!.positions[0].x, y: robotServiceData!.positions[0].y };
            this.position = { x: robotServiceData!.positions[1].x, y: robotServiceData!.positions[1].y };
            AppComponent.log("RobotAspiratorComponent this.batterie = " + this.batterie.toString());
            AppComponent.log("this.lastPosition.x = " + this.lastPosition.x.toString());
            AppComponent.log("this.lastPosition.y =" + this.lastPosition.y.toString());
            AppComponent.log("this.position.x = " + this.position.x.toString());
            AppComponent.log("this.position.y = " + this.position.y.toString());

            try {
              observer.next([this.lastPosition, this.position]);
            } catch (error) {
              console.error("RobotAspiratorComponent Erreur lors de l'émission de la position:", error);
            }
          }
        }),
        finalize(() => {
          // Ce bloc s'exécute UNE SEULE FOIS à la fin
          AppComponent.log("*********");
          AppComponent.log('RobotAspiratorComponent complete nettoyer: Nettoyage ok ou batterie insuffisante !');
          this.retournerALaBaseSouscription(observer);
          stopNettoyer$.complete(); // Nettoyer le Subject
        })
      ).subscribe({
        error: (err: string) => {
          AppComponent.log('RobotAspiratorComponent Erreur nettoyer: ' + err);
          stopNettoyer$.complete(); // Nettoyer le Subject même en cas d'erreur
        }
      })
    );
  }

  private retournerALaBaseSouscription(observer: Subscriber<Position[]>): void {
    AppComponent.log("Retour à la base");
    AppComponent.log(`Batterie: ${this.batterie}%. Retour à la base.`);

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
          AppComponent.log('RobotAspiratorComponent - next retournerALaBaseSouscription...');

          console.log(robotServiceData);

          this.batterie = robotServiceData!.batterie;
          if(this.batterie <= 0) {
            AppComponent.log('Batterie à plat ! Robot en panne...');
            this.subscription!.unsubscribe();
            observer.complete();
            return;
          }

          if (robotServiceData.positions.length === 0) {
            AppComponent.log('Chemin de retour vide');
            this.subscription!.unsubscribe();
            observer.complete();
            return;
          }

          this.lastPosition = { x: robotServiceData!.positions[0].x, y: robotServiceData!.positions[0].y };
          this.position = { x: robotServiceData!.positions[1].x, y: robotServiceData!.positions[1].y };

          AppComponent.log("RobotAspiratorComponent this.batterie = " + this.batterie.toString());
          AppComponent.log(this.lastPosition.x.toString());
          AppComponent.log(this.lastPosition.y.toString());
          AppComponent.log(this.position.x.toString());
          AppComponent.log(this.position.y.toString());


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
          AppComponent.log('RobotAspiratorComponentErreur retournerALaBase: ' + err);
        },
        complete: () => {
          AppComponent.log('RobotAspiratorComponent complete retournerALaBase: ok !');
          this.isRobotStarted = false;
          observer.complete();
        }
      })
    );
  }

}
