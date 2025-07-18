import { Component, OnDestroy } from '@angular/core';
import { AppComponent } from '../app.component';
import { Observable, Subscription } from 'rxjs';
import { Position } from '../../classes/position';
import { RobotAspiratorService } from '../../services/robot-actions/robot-aspirator.service';
import { PositionResult } from '../../classes/positionResult';

@Component({
  selector: 'app-robot-aspirator',
  imports: [],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css'
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription: Subscription;
  private robotAspiratorService: RobotAspiratorService;

  // Position actuelle
  position: Position;
  lastPosition: Position;
  isRobotStarted: boolean;
  // Niveau de batterie (en pourcentage)
  public batterie: number;
  // Combien d'énergie est consommée par mouvement
  consommationParMouvement: number;

  constructor() {
    this.subscription = new Subscription();
    this.robotAspiratorService = new RobotAspiratorService();

    this.position = { ...AppComponent.basePosition };
    this.lastPosition = { ...AppComponent.basePosition };
    this.batterie = 100;

    this.isRobotStarted = false;
    // this.energieRetourBase = 0; // Sera calculée dynamiquement
    // Combien d'énergie est consommée par mouvement
    this.consommationParMouvement = 0.5;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public pauseRobot(): void {
    this.subscription.unsubscribe();

    this.robotAspiratorService.onPause();

    this.isRobotStarted = false;
  }

  // Fonction principale pour nettoyer la maison
  public onStartNettoyer(): Observable<Position[]> {

    return new Observable<Position[]>((observer) => {

      this.subscription = new Subscription();
      this.robotAspiratorService = new RobotAspiratorService();

      this.robotAspiratorService = new RobotAspiratorService();

      this.subscription.add(
        this.robotAspiratorService.robotPosition$.subscribe(update => {
          // console.log('Robot moved:', update.current, 'from:', update.last);
          // Mettre à jour l'affichage du robot si nécessaire
        })
      );

      // en cas de mise en pause
      // TODO: revoir pour la pause:
      if (this.isRobotStarted) {
        observer.complete();
        return;
      }

      // si l'on préfère afficher le robot seulement après clic sur start:
      AppComponent.log("Début du nettoyage");
      this.isRobotStarted = true;
      // algo principal de nettoyage de la maison
      this.subscription.add(
        this.robotAspiratorService.nettoyerAvecControle(
          this.position,
          this.lastPosition,
          this.batterie,
          this.isRobotStarted,
          this.consommationParMouvement
        ).subscribe({
          next: (positionResult: PositionResult) => {
            console.log("onStartNettoyer next nettoyer...");
            // console.log(positionResult);
            // TODO: revoir null pointer ici:
            this.lastPosition = { x: positionResult?.positions[0].x, y: positionResult?.positions[0].y };
            this.position = { x: positionResult?.positions[1].x, y: positionResult?.positions[1].y };

            AppComponent.log("this.lastPosition.x = " + this.lastPosition.x.toString());
            AppComponent.log("this.lastPosition.y  =" + this.lastPosition.y.toString());
            AppComponent.log("this.position.x = " + this.position.x.toString());
            AppComponent.log("this.position.y = " + this.position.y.toString());

            if (positionResult.isNettoyageComplete === true) {
              AppComponent.log('Nettoyage terminé !');
            }
            observer.next([this.lastPosition, this.position]);
          },
          error: (err: string) => {
            AppComponent.log('Erreur nettoyer: ' + err);
          },
          complete: () => {
            AppComponent.log('complete nettoyer: Nettoyage ok !');
            // Retourner à la base de charge
            AppComponent.log(`Batterie: ${this.batterie}%. Retour à la base.`);

            // puis on souscrit à retournerALaBase
            this.subscription.add(
              this.robotAspiratorService.retournerALaBase(
                this.position,
                this.lastPosition,
                this.batterie,
                this.isRobotStarted,
                this.consommationParMouvement
              ).subscribe({
                next: () => {
                  AppComponent.log('next retournerALaBase...');
                  AppComponent.log(this.lastPosition.x.toString());
                  AppComponent.log(this.lastPosition.y.toString());
                  AppComponent.log(this.position.x.toString());
                  AppComponent.log(this.position.y.toString());
                  observer.next([this.lastPosition, this.position]);
                },
                error: (err: string) => {
                  AppComponent.log('Erreur retournerALaBase: ' + err);
                },
                complete: () => {
                  AppComponent.log('complete retournerALaBase: ok !');
                  this.isRobotStarted = false;
                  observer.complete();
                }
              })
            );
          }
        })
      );
    });
  }

}
