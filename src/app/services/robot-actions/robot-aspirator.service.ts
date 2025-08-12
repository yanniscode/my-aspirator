import { Injectable } from '@angular/core';
import { Position } from '../../classes/position';
import { RobotServiceData } from '../../classes/RobotServiceData';

import { finalize, map, Observable, Subject, Subscriber, Subscription, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';
import { MessageService } from '../message.service';
import { Cell } from '../../classes/cell';
import { RobotAspiratorModel } from '../../classes/robot-aspirator-model';

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

  // TODO: supprimer après modif de retour à la base:
  // private updateSubscriptionSeDeplacerVers?: Subscription;

  // TODO: supprimer var si non-utilisées
  private isRobotStarted: boolean = false;
  private basePosition: Position;
  private lastPosition: Position;
  // Position actuelle
  private position: Position = { x: 0, y: 0 };
  // Niveau de batterie (en pourcentage)
  private batterie: number = 0;
  private consommationParMouvement: number;

  private cheminRestant: Position[] = [];
  private isNettoyageComplete: boolean = false;

  constructor(private messageService: MessageService, private cheminOptimalService: CheminOptimalService) {

    // this.robotPositionSubject = new Subject<RobotServiceData>();
    // this.robotPosition$ = this.robotPositionSubject.asObservable();

    this.basePosition = { x: -1, y: -1 };
    this.lastPosition = { ...this.basePosition };
    this.consommationParMouvement = 0.5;
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
    // TODO: revoir ici : remettre var "globale" privée : this.robot
    this.isRobotStarted = false;

  }

  // Fonction principale pour nettoyer la maison
  public onStartNettoyer(maison: Cell[][], robot: RobotAspiratorModel): Observable<RobotServiceData> {

    console.log("onStartNettoyer robot");
    console.log(robot);
    this.isRobotStarted = robot.isRobotStarted;
    this.basePosition = robot.basePosition;
    this.lastPosition = robot.lastPosition;
    this.position = robot.position;
    this.batterie = robot.batterie;
    this.consommationParMouvement = robot.consommationParMouvement;

    return new Observable<RobotServiceData>((observer) => {
      console.log(this.subscription);
      if (!this.subscription || this.subscription.closed) {
        console.log("onStartNettoyer new subscription !")
        this.subscription = new Subscription();

        // this.robotAspiratorService = new RobotAspiratorService(this.messageService);

        // this.subscription!.add(
        //   this.robotPosition$.subscribe()
        // );
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

  private nettoyerAvecControleSouscription(maison: Cell[][], observer: Subscriber<RobotServiceData>): void {
    console.log("Début du nettoyage");
    console.log(`Batterie: ${this.batterie}%.`);

    const stopNettoyer$ = new Subject<void>();

    this.subscription!.add(
      this.nettoyerAvecControle(
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
          else if (robotServiceData!.positions.length && robotServiceData!.batterie <= this.energieNecessairePourRetour(this.basePosition, robotServiceData!.positions[1], this.consommationParMouvement)) {
            console.log("Batterie insuffisante : retour à la base de charge nécessaire...");

            // TODO: test : ajout sinon s'arrête sans attendre la fin de l'interval souhaité:
            // Au retour, bug : si la batterie HS, le robot ne prend pas sa dernière position avant de rentrer à la base:
            setTimeout(() => {
              stopNettoyer$.next();
              return;
            }, 500);
          }

          // Continuer le nettoyage
          this.lastPosition = { x: robotServiceData!.positions[0]!.x, y: robotServiceData!.positions[0]!.y };
          this.position = { x: robotServiceData!.positions[1]!.x, y: robotServiceData!.positions[1]!.y };
          this.batterie = robotServiceData!.batterie;

          console.log("this.lastPosition.x = " + this.lastPosition.x.toString());
          console.log("this.lastPosition.y =" + this.lastPosition.y.toString());
          console.log("this.position.x = " + this.position.x.toString());
          console.log("this.position.y = " + this.position.y.toString());
          console.log("this.batterie =" + this.batterie.toString());
          console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(this.basePosition, robotServiceData?.positions[1], this.consommationParMouvement).toString());

          try {
            observer.next(robotServiceData);
          } catch (error) {
            console.log("Erreur lors de l'émission de la position: " + error);
          }
        }),
        finalize(() => {
          // Ce bloc s'exécute UNE SEULE FOIS à la fin
          console.log('complete nettoyerAvecControleSouscription: Nettoyage ok ou batterie insuffisante !');
          this.retournerALaBaseSouscription(maison, observer);

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

  private retournerALaBaseSouscription(maison: Cell[][], observer: Subscriber<RobotServiceData>): void {

    console.log("*** Retour à la base ***");
    console .log(`Batterie: ${this.batterie}%. Retour à la base.`);

    this.subscription!.add(
      this.nettoyerAvecControle(
        true, // isRetourAlaBase = true
        maison,
        this.basePosition,
        this.position,
        this.batterie,
        this.isRobotStarted,
        this.consommationParMouvement
      ).subscribe({
        next: (robotServiceData: RobotServiceData) => {

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
          this.lastPosition = { x: robotServiceData!.positions[0]!.x, y: robotServiceData!.positions[0]!.y };
          this.position = { x: robotServiceData!.positions[1]!.x, y: robotServiceData!.positions[1]!.y };
          this.batterie = robotServiceData!.batterie;

          console.log("this.lastPosition.x = " + this.lastPosition.x.toString());
          console.log("this.lastPosition.y =" + this.lastPosition.y.toString());
          console.log("this.position.x = " + this.position.x.toString());
          console.log("this.position.y = " + this.position.y.toString());
          console.log("this.batterie =" + this.batterie.toString());
          console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(this.basePosition, robotServiceData?.positions[1], this.consommationParMouvement).toString());

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
          this.isRobotStarted = false;
          observer.complete();
        }
      })
    );
  }


  // ******************

  // TODO: à simplifier ?
  private nettoyerAvecControle(
    isRetourAlaBase: boolean,
    maison: Cell[][],
    basePosition: Position,
    position: Position,
    batterie: number,
    isRobotStarted: boolean,
    consommationParMouvement: number,
    intervalMs: number = 600
  ): Observable<RobotServiceData> {

    // console.log(this.robotPositionSubject);
    // if (this.robotPositionSubject.closed) {
    //   this.robotPositionSubject = new Subject<RobotServiceData>();
    //   // this.robotPosition$ = this.robotPositionSubject.asObservable();
    // }

    this.basePosition = basePosition;
    this.position = { ...position };
    this.batterie = batterie;
    this.isRobotStarted = isRobotStarted;
    this.cheminRestant = [];
    this.isNettoyageComplete = false;

    // Calculer le chemin initial
    this.cheminRestant = this.cheminOptimalService.calculateNextPath(isRetourAlaBase, maison, this.basePosition, this.position);
    if (this.cheminRestant.length === 0) {
      this.isNettoyageComplete = true;
    }

    // Utiliser un timer régulier pour l'animation
    return timer(0, intervalMs).pipe(
      map(() => this.processNextMove(maison, consommationParMouvement, isRetourAlaBase, basePosition)),
      takeWhile(result => !result.isNettoyageComplete && this.batterie > 0, true),
      tap(result => {
        console.log(result);
        // // Émettre la mise à jour de position
        // if (result.positions.length > 0) {
        //   this.robotPositionSubject.next(result);
        // }
      })
    );
  }

  private processNextMove(maison: Cell[][], consommationParMouvement: number, isRetourAlaBase: boolean, basePosition: Position): RobotServiceData {

    console.log("########## processNextMove");

    let robotServiceData: RobotServiceData = {
      // on actualise ici le niveau de batterie
      batterie: this.batterie,
      isNettoyageComplete: false,
      positions: []
    };

    console.log(this.batterie.toString());
    this.batterie -= consommationParMouvement;
    robotServiceData.batterie = this.batterie;

    // console.log(robotServiceData);

    // Vérifier les conditions d'arrêt
    if (!this.isRobotStarted || this.isNettoyageComplete) {

      robotServiceData.isNettoyageComplete = true;

      console.log(robotServiceData);
      return robotServiceData;
    }

    // Si le chemin actuel est terminé, chercher la prochaine destination
    // Cette action est valable seulement si isRetourAlaBase = false;
    if (this.cheminRestant.length === 0 && isRetourAlaBase === false) {
      this.cheminRestant = this.cheminOptimalService.calculateNextPath(false, maison, basePosition, this.position);

      // Après calcul du nouveau chemin, actualisant this.cheminRestant, si aucune nouvelle destination n'est trouvée, le netttoyage est complet:
      if (this.cheminRestant.length === 0) {
        robotServiceData.isNettoyageComplete = true;

        console.log(robotServiceData);
        return robotServiceData;
      }

    }

    if (this.cheminRestant.length !== 0) {

      const lastPos = { ...this.position };

      // Mettre à jour la position
      // Prendre la prochaine position du chemin actuel
      this.position = this.cheminRestant.shift()!;

      console.log(`Déplacement vers (${this.position.x}, ${this.position.y}). Batterie: ${this.batterie.toFixed(1)}%`);

      // TODO: simplifier en appelant un service externe où serait la Maison pour l'update des positions ?

      robotServiceData.positions = [lastPos, this.position];
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
