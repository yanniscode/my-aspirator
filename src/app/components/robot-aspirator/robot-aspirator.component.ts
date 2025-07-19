import { Component, OnDestroy } from '@angular/core';
import { AppComponent } from '../app.component';
import { Observable, Subscription } from 'rxjs';
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
  private batterie: number;
  // Combien d'énergie est consommée par mouvement
  private consommationParMouvement: number;

  constructor() {
    // this.subscription = new Subscription();
    this.robotAspiratorService = new RobotAspiratorService();

    // TODO: basePosition à modifier en non static, si plusieurs robots présents 
    this.position = { ...AppComponent.basePosition };
    this.lastPosition = { ...AppComponent.basePosition };
    this.batterie = 100;

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
        console.log("onStartNettoyer new subscription !")
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

      // si l'on préfère afficher le robot seulement après clic sur start:
      AppComponent.log("Début du nettoyage");
      this.isRobotStarted = true;
      // algo principal de nettoyage de la maison
      AppComponent.log(`Batterie: ${this.batterie}%. Retour à la base.`);

      this.subscription!.add(
        this.robotAspiratorService.nettoyerAvecControle(
          false,  // isRetourAlaBase = false
          this.position,
          this.lastPosition,
          this.batterie,
          this.isRobotStarted,
          this.consommationParMouvement
        ).subscribe({
          next: (robotServiceData: RobotServiceData) => {
            console.log("onStartNettoyer next nettoyer...");
            // console.log(robotServiceData);

            if (robotServiceData!.isNettoyageComplete === true) {
              AppComponent.log('Nettoyage terminé !');
              
              return;
            } else {
              this.batterie = robotServiceData!.batterie;
              this.lastPosition = { x: robotServiceData!.positions[0].x, y: robotServiceData!.positions[0].y };
              this.position = { x: robotServiceData!.positions[1].x, y: robotServiceData!.positions[1].y };

              AppComponent.log("this.batterie = " + this.batterie.toString());
              AppComponent.log("this.lastPosition.x = " + this.lastPosition.x.toString());
              AppComponent.log("this.lastPosition.y  =" + this.lastPosition.y.toString());
              AppComponent.log("this.position.x = " + this.position.x.toString());
              AppComponent.log("this.position.y = " + this.position.y.toString());
              
              observer.next([this.lastPosition, this.position]);
            }
          },
          error: (err: string) => {
            AppComponent.log('Erreur nettoyer: ' + err);
          },
          complete: () => {
            AppComponent.log('complete nettoyer: Nettoyage ok !');
            // Retourner à la base de charge
            AppComponent.log(`Batterie: ${this.batterie}%. Retour à la base.`);

            // puis on souscrit à retournerALaBase
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
                  AppComponent.log('next retournerALaBase...');

                  if (robotServiceData.positions.length === 0) {
                    AppComponent.log('Chemin de retour vide');
                    return;
                  }

                  this.batterie = robotServiceData!.batterie;
                  this.lastPosition = { x: robotServiceData!.positions[0].x, y: robotServiceData!.positions[0].y };
                  this.position = { x: robotServiceData!.positions[1].x, y: robotServiceData!.positions[1].y };
                  
                  AppComponent.log("this.batterie = " + this.batterie.toString());
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
