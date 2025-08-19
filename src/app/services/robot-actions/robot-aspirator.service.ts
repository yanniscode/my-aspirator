import { Injectable } from '@angular/core';

import { finalize, map, Observable, Subject, Subscriber, Subscription, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';
import { MessageService } from '../message-service/message.service';
import { Position } from '../../classes/models/position';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { RobotServiceDtoOut } from '../../classes/dtos/robot-service-dto-out';
import { MaisonModel } from '../../classes/models/maison-model';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorService {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  // 3. Subject pour émettre les mises à jour de position
  // TODO: revoir si nécessaire:
  // private robotPositionSubject: Subject<RobotServiceData>;
  // public robotPosition$: Observable<RobotServiceData>;

  constructor(private messageService: MessageService, private cheminOptimalService: CheminOptimalService) {
  }

  ngOnDestroy(): void {
    // if (this.robotPositionSubject) {
    //   this.robotPositionSubject.complete();
    // }
  }

  public log(message: string) {
    this.messageService.add(`RobotAspiratorService: ${message}`);
  }

  public onPause(): void {
    this.subscription?.unsubscribe();
    // if (this.robotPositionSubject) {
    //   this.robotPositionSubject.complete();
    // }
    // TODO: revoir
    // this.isRobotStarted = false;

  }

  // Fonction principale pour nettoyer la maison
  public onStartNettoyer(maisonModel: MaisonModel, robot: RobotAspiratorModel): Observable<RobotServiceDtoOut> {

    console.log("RobotAspiratorService onStartNettoyer()");
    console.log(robot.robotName);
    console.log(robot);
    console.log(robot.position);

    return new Observable<RobotServiceDtoOut>((observer) => {
      console.log(this.subscription);
      if (!this.subscription || this.subscription.closed) {
        console.log("onStartNettoyer new subscription !")
        this.subscription = new Subscription();

        // this.subscription!.add(
        //   this.robotPosition$.subscribe()
        // );
      }

      // TODO: revoir:
      // robot.isRobotStarted = true;

      // en cas de mise en pause
      if (!robot.isRobotStarted) {
        observer.complete();
        return;
      }

      // Méthode principale de nettoyage de la maison
      robot.isRobotStarted = true;
      this.nettoyerAvecControleSouscription(maisonModel, robot, observer);
    });
  }

  private nettoyerAvecControleSouscription(maisonModel: MaisonModel, robot: RobotAspiratorModel, observer: Subscriber<RobotServiceDtoOut>): void {
    console.log("Début du nettoyage");
    console.log(`Batterie: ${robot.batterie}%.`);

    const stopNettoyer$ = new Subject<void>();

    this.subscription!.add(
      this.nettoyerAvecControle(
        false,  // isRetourAlaBase = false
        maisonModel,
        robot
      ).pipe(
        takeUntil(stopNettoyer$), // L'Observable continue jusqu'à ce que stopNettoyer$ émette
        tap((robotServiceData: RobotServiceDtoOut) => {

          console.log('*** next nettoyerAvecControleSouscription...');
          console.log(robotServiceData);

          if (!robotServiceData.positions.length) {
            console.log('*** Aucun chemin trouvé ***');
            stopNettoyer$.next(); // Déclenche l'arrêt
            return;
          }
          else if (robotServiceData!.isNettoyageComplete === true) {
            console.log('Nettoyage terminé !');
            stopNettoyer$.next();
            return;
          }
          else if (robotServiceData!.positions.length &&
            robotServiceData!.batterie <= this.energieNecessairePourRetour(
              robot.basePosition, robotServiceData!.positions[1], robot.consommationParMouvement)
          ) {
            console.log("Batterie insuffisante : retour à la base de charge nécessaire...");

            // TODO: test : ajout sinon s'arrête sans attendre la fin de l'interval souhaité:
            // Au retour, bug : si la batterie HS, le robot ne prend pas sa dernière position avant de rentrer à la base:
            setTimeout(() => {
              stopNettoyer$.next();
              return;
            }, 500);
          }

          // Continuer le nettoyage
          robot.lastPosition = { x: robotServiceData!.positions[0]!.x, y: robotServiceData!.positions[0]!.y };
          robot.position = { x: robotServiceData!.positions[1]!.x, y: robotServiceData!.positions[1]!.y };
          robot.batterie = robotServiceData!.batterie;

          console.log("this.lastPosition.x = " + robot.lastPosition.x.toString());
          console.log("this.lastPosition.y =" + robot.lastPosition.y.toString());
          console.log("this.position.x = " + robot.position.x.toString());
          console.log("this.position.y = " + robot.position.y.toString());
          console.log("this.batterie =" + robot.batterie.toString());
          console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(
            robot.basePosition, robotServiceData?.positions[1], robot.consommationParMouvement).toString()
          );

          try {
            observer.next(robotServiceData);
          } catch (error) {
            console.log("Erreur lors de l'émission de la position: " + error);
          }
        }),
        finalize(() => {
          // Ce bloc s'exécute UNE SEULE FOIS à la fin
          console.log('complete nettoyerAvecControleSouscription: Nettoyage ok ou batterie insuffisante !');
          this.retournerALaBaseSouscription(maisonModel, robot, observer);

          stopNettoyer$.complete(); // Nettoyer le Subject
        })
      ).subscribe({
        error: (err: string) => {
          console.log('Erreur nettoyer: ' + err);
          stopNettoyer$.complete(); // Nettoyer le Subject même en cas d'erreur
        }
      })
    );
  }

  private retournerALaBaseSouscription(maisonModel: MaisonModel, robot: RobotAspiratorModel, observer: Subscriber<RobotServiceDtoOut>): void {

    console.log("*** Retour à la base ***");
    console.log(`Batterie: ${robot.batterie}%. Retour à la base.`);

    this.subscription!.add(
      this.nettoyerAvecControle(
        true, // isRetourAlaBase = true
        maisonModel,
        robot
      ).subscribe({
        next: (robotServiceData: RobotServiceDtoOut) => {

          console.log('next retournerALaBaseSouscription...');
          console.log(robotServiceData);

          if (!robotServiceData!.positions.length) {
            console.log('*** Aucun chemin trouvé ***');
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
          robot.lastPosition = { x: robotServiceData!.positions[0]!.x, y: robotServiceData!.positions[0]!.y };
          robot.position = { x: robotServiceData!.positions[1]!.x, y: robotServiceData!.positions[1]!.y };
          robot.batterie = robotServiceData!.batterie;

          console.log("robot.lastPosition.x = " + robot.lastPosition.x.toString());
          console.log("robot.lastPosition.y =" + robot.lastPosition.y.toString());
          console.log("robot.position.x = " + robot.position.x.toString());
          console.log("robot.position.y = " + robot.position.y.toString());
          console.log("robot.batterie =" + robot.batterie.toString());
          console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(
            robot.basePosition, robotServiceData?.positions[1], robot.consommationParMouvement).toString()
          );

          try {
            observer.next(robotServiceData);
          } catch (error) {
            console.log("Erreur lors de l'émission de la position: " + error);
          }

        },
        error: (err: string) => {
          console.log('Erreur retournerALaBase: ' + err);
        },
        complete: () => {
          console.log('complete retournerALaBase: ok !');
          robot.isRobotStarted = false;
          observer.complete();
        }
      })
    );
  }


  // ******************

  // TODO: à simplifier ?
  private nettoyerAvecControle(
    isRetourAlaBase: boolean,
    maisonModel: MaisonModel,
    robot: RobotAspiratorModel,
    intervalMs: number = 600
  ): Observable<RobotServiceDtoOut> {

    // console.log(this.robotPositionSubject);
    // if (this.robotPositionSubject.closed) {
    //   this.robotPositionSubject = new Subject<RobotServiceData>();
    //   // this.robotPosition$ = this.robotPositionSubject.asObservable();
    // }

    maisonModel.isNettoyageComplete = false;

    // Calculer le chemin initial
    const cheminRestant: Position[] =
      this.cheminOptimalService.calculateNextPath(isRetourAlaBase, maisonModel.maison, robot.basePosition, robot.position);
    if (cheminRestant.length === 0) {
      maisonModel.isNettoyageComplete = true;
    }

    // Utiliser un timer régulier pour l'animation
    return timer(0, intervalMs).pipe(
      map(() => this.processNextMove(maisonModel, robot, cheminRestant, isRetourAlaBase)),
      takeWhile(result => !result.isNettoyageComplete && robot.batterie > 0, true),
      tap(result => {
        console.log(result);
        // // Émettre la mise à jour de position
        // if (result.positions.length > 0) {
        //   this.robotPositionSubject.next(result);
        // }
      })
    );
  }

  private processNextMove(maisonModel: MaisonModel, robot: RobotAspiratorModel, cheminRestant: Position[], isRetourAlaBase: boolean): RobotServiceDtoOut {

    console.log("########## processNextMove");

    let robotServiceData: RobotServiceDtoOut = {
      // on actualise ici le niveau de batterie
      batterie: robot.batterie,
      isNettoyageComplete: false,
      positions: []
    };

    console.log(robot.batterie.toString());
    robot.batterie -= robot.consommationParMouvement;
    robotServiceData.batterie = robot.batterie;
    // console.log(robotServiceData);

    // Vérifier les conditions d'arrêt
    if (!robot.isRobotStarted || maisonModel.isNettoyageComplete) {
      robotServiceData.isNettoyageComplete = true;
      console.log(robotServiceData);

      return robotServiceData;
    }

    // Si le chemin actuel est terminé, chercher la prochaine destination
    // Cette action est valable seulement si isRetourAlaBase = false;
    if (cheminRestant.length === 0 && isRetourAlaBase === false) {
      cheminRestant = this.cheminOptimalService.calculateNextPath(false, maisonModel.maison, robot.basePosition, robot.position);

      // Après calcul du nouveau chemin, actualisant this.cheminRestant, si aucune nouvelle destination n'est trouvée, le netttoyage est complet:
      if (cheminRestant.length === 0) {
        robotServiceData.isNettoyageComplete = true;

        console.log(robotServiceData);
        return robotServiceData;
      }

    }

    if (cheminRestant.length !== 0) {

      robot.lastPosition = { ...robot.position };

      // Mettre à jour la position
      // Prendre la prochaine position du chemin actuel
      robot.position = { ...cheminRestant.shift()! };

      console.log(`Déplacement vers (${robot.position.x}, ${robot.position.y}). Batterie: ${robot.batterie.toFixed(1)}%`);

      robotServiceData.positions = [robot.lastPosition, robot.position];
      robotServiceData.isNettoyageComplete = false;
    }

    return robotServiceData;
  }

  // Estimer l'énergie nécessaire pour retourner à la base
  public energieNecessairePourRetour(basePosition: Position, position: Position, consommationParMouvement: number): number {
    // Estimer la distance jusqu'à la base
    const distance = this.cheminOptimalService.distance(position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité
    return (distance * consommationParMouvement) * 1.2;
  }
}
