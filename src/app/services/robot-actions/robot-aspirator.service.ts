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

  // Nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  // Subject pour émettre les mises à jour de position
  // TODO: revoir si nécessaire:
  // private robotPositionSubject: Subject<RobotServiceData>;
  // public robotPosition$: Observable<RobotServiceData>;

  constructor(private messageService: MessageService, private cheminOptimalService: CheminOptimalService) { }

  ngOnDestroy(): void {
    // if (this.robotPositionSubject) {
    //   this.robotPositionSubject.complete();
    // }
  }

  public log(message: string) {
    this.messageService.add(`RobotAspiratorService: ${message}`);
  }

  public getRobotsParams(): RobotAspiratorModel[] {

    // robot1 test
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    let robotName = "robot1";
    let basePosition = { x: 0, y: 0 };
    // au départ, le robot est à la base:
    let lastPosition = { ...basePosition };
    let position = { ...basePosition };
    let batterie = 12.5;
    let isRobotStarted = false;
    let isRobotReturningToBase = false;

    let robot1Model = new RobotAspiratorModel();
    robot1Model.robotName = robotName;
    robot1Model.basePosition = { ...basePosition };
    // au départ, le robot est à la base:
    robot1Model.lastPosition = { ...lastPosition };
    robot1Model.position = { ...position };
    robot1Model.batterie = batterie;
    robot1Model.isRobotStarted = isRobotStarted;
    robot1Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot1Model);

    // robot2 test
    robotName = "robot2";
    // TODO: possible récupération des données dans des objets JSON / appels HTTP
    basePosition = { x: 9, y: 0 };
    // au départ, le robot est à la base:
    lastPosition = { ...basePosition };
    position = { ...basePosition };
    batterie = 50;
    isRobotStarted = false;
    isRobotReturningToBase = false;

    let robot2Model = new RobotAspiratorModel();
    robot2Model.robotName = robotName;
    robot2Model.basePosition = { ...basePosition };
    // au départ, le robot est à la base:
    robot2Model.lastPosition = { ...lastPosition };
    robot2Model.position = { ...position };
    robot2Model.batterie = batterie;
    robot2Model.isRobotStarted = isRobotStarted;
    robot2Model.isRobotReturningToBase = isRobotReturningToBase;

    console.log(robot2Model);

    return [robot1Model, robot2Model]; // TODO: test avec 2 robots
  }

  public onPauseRobotService(): void {
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
    console.log("robot");
    console.log(robot);
    console.log(robot.position);
    console.log(robot.position.x);
    console.log(robot.position.y);
    console.log(robot.isRobotStarted);
    console.log(robot.isRobotReturningToBase);


    return new Observable<RobotServiceDtoOut>((observer) => {
      // console.log(this.subscription);
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

    let nextPathStopSearchFlag: boolean = false;

    if (this.robotMustStop(robot)) {
      console.log("1/ Batterie insuffisante : retour à la base de charge nécessaire...");
      // on active le flag stoppant la recherche d'un nouveau chemin,
      //  si le robot n'a pas l'énergie nécessaire pour continuer
      nextPathStopSearchFlag = true;
    }

    this.subscription = this.nettoyerAvecControle(
      robot.isRobotReturningToBase,  // isRetourAlaBase = false
      maisonModel,
      robot,
      nextPathStopSearchFlag
    ).pipe(
      takeUntil(stopNettoyer$), // L'Observable continue jusqu'à ce que stopNettoyer$ émette
      tap((robotServiceDtoOut: RobotServiceDtoOut) => {

        console.log("robot");
        console.log(robot);
        console.log(robot.position);
        console.log(robot.position.x);
        console.log(robot.position.y);
        console.log('*** next nettoyerAvecControleSouscription...');
        console.log(robotServiceDtoOut);

        if (robotServiceDtoOut.isRobotReturningToBase) {
          console.log('*** Le robot rentre actuellement à la base : Pas de reprise du nettoyage ***');

          // on active le flag pour entreprendre la recherche du chemin de retour
          nextPathStopSearchFlag = false;

          stopNettoyer$.next(); // Déclenche l'arrêt
          // return; // TODO: pb au retour ici: revoir
        } else if (!robotServiceDtoOut.positions.length) {
          console.log('*** Aucun chemin trouvé ***');
          stopNettoyer$.next(); // Déclenche l'arrêt
          return;
        }
        else if (robotServiceDtoOut!.isNettoyageComplete === true) {
          console.log('Nettoyage terminé !');
          stopNettoyer$.next();
          return;
        }
        else if (this.robotMustStop(robot)) {
          console.log("Batterie insuffisante : retour à la base de charge nécessaire...");

          // TODO: test : ajout sinon s'arrête sans attendre la fin de l'interval souhaité:
          // Au retour, bug : si la batterie HS, le robot ne prend pas sa dernière position avant de rentrer à la base:
          // setTimeout(() => {
          stopNettoyer$.next();
          // return;
          // }, 300);

        } else {
          // Continuer le nettoyage
          robot.lastPosition = { x: robotServiceDtoOut!.positions[0]!.x, y: robotServiceDtoOut!.positions[0]!.y };
          robot.position = { x: robotServiceDtoOut!.positions[1]!.x, y: robotServiceDtoOut!.positions[1]!.y };
          robot.batterie = robotServiceDtoOut!.batterie;
          robot.isRobotReturningToBase = false; // TODO tester

          console.log("this.lastPosition.x = " + robot.lastPosition.x.toString());
          console.log("this.lastPosition.y =" + robot.lastPosition.y.toString());
          console.log("this.position.x = " + robot.position.x.toString());
          console.log("this.position.y = " + robot.position.y.toString());
          console.log("this.batterie =" + robot.batterie.toString());
          console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(
            robot.basePosition, robotServiceDtoOut?.positions[1], robot.consommationParMouvement).toString()
          );

        }

        try {
          // Au retour, bug : si la batterie HS, le robot ne prend pas sa dernière position avant de rentrer à la base:
          // setTimeout(() => {
          observer.next(robotServiceDtoOut);
          // }, 0);


        } catch (error) {
          console.log("Erreur lors de l'émission de la position: " + error);
        }
      }),
      finalize(() => {
        // Ce bloc s'exécute UNE SEULE FOIS à la fin
        console.log('complete nettoyerAvecControleSouscription: Nettoyage ok ou batterie insuffisante !');
        console.log("robot");
        console.log(robot);
        console.log(robot.position);
        console.log(robot.position.x);
        console.log(robot.position.y);

        // Au retour, 2 bugs sans setTimeout():
        // si la batterie HS, le robot ne prend pas sa dernière position avant de rentrer à la base
        // + si robot mis en pause au retour, pb d'animation: au redémarrage, passe 2 cases en un tour:
        setTimeout(() => {
          // robot.isRobotReturningToBase = true; // TODO tester
          if (robot.isRobotStarted) {
            this.retournerALaBaseSouscription(maisonModel, robot, observer);
          }
        }, 500);

        stopNettoyer$.complete(); // Nettoyer le Subject
      })
    ).subscribe({
      error: (err: string) => {
        console.log('Erreur nettoyer: ' + err);
        stopNettoyer$.complete(); // Nettoyer le Subject même en cas d'erreur
      }
    });
  }

  private retournerALaBaseSouscription(maisonModel: MaisonModel, robot: RobotAspiratorModel, observer: Subscriber<RobotServiceDtoOut>): void {

    console.log("*** Retour à la base ***");
    console.log("robot");
    console.log(robot);
    console.log(robot.position);
    console.log(robot.position.x);
    console.log(robot.position.y);
    console.log(`Batterie: ${robot.batterie}%. Retour à la base.`);

    let nextPathStopSearchFlag: boolean = false;

    // if (this.robotMustStop(robot)) {
    // console.log("1/ Batterie insuffisante : retour à la base de charge nécessaire...");
    // On n'active pas ici le flag annulant la recherche d'un nouveau chemin
    // Donc, si le robot n'a pas l'énergie nécessaire pour continuer, on recherche quand même le chemin du retour
    nextPathStopSearchFlag = false;
    // }

    this.subscription = this.nettoyerAvecControle(
      true, // isRetourAlaBase = true
      maisonModel,
      robot,
      nextPathStopSearchFlag
    ).subscribe({
      next: (RobotServiceDtoOut: RobotServiceDtoOut) => {

        console.log('next retournerALaBaseSouscription...');
        // console.log(RobotServiceDtoOut);

        if (!RobotServiceDtoOut!.positions.length) {
          console.log('*** Aucune position trouvée pour le robot (lastPosition, position) ***');
          this.subscription!.unsubscribe();
          observer.complete();
          return;
        }
        else if (RobotServiceDtoOut!.batterie <= 0) {
          this.log('Batterie à plat ! Robot en panne...');
          this.subscription!.unsubscribe();
          observer.complete();
          return;
        }

        // Continuer le retour à la base
        robot.lastPosition = { x: RobotServiceDtoOut!.positions[0]!.x, y: RobotServiceDtoOut!.positions[0]!.y };
        robot.position = { x: RobotServiceDtoOut!.positions[1]!.x, y: RobotServiceDtoOut!.positions[1]!.y };
        robot.batterie = RobotServiceDtoOut!.batterie;
        robot.isRobotReturningToBase = true; // TODO tester

        console.log("robot.lastPosition.x = " + robot.lastPosition.x.toString());
        console.log("robot.lastPosition.y =" + robot.lastPosition.y.toString());
        console.log("robot.position.x = " + robot.position.x.toString());
        console.log("robot.position.y = " + robot.position.y.toString());
        console.log("robot.batterie =" + robot.batterie.toString());
        console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(
          robot.basePosition, RobotServiceDtoOut?.positions[1], robot.consommationParMouvement).toString()
        );

        try {
          observer.next(RobotServiceDtoOut);
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
    });
  }

  // TODO: à simplifier ?
  private nettoyerAvecControle(
    isRetourAlaBase: boolean,
    maisonModel: MaisonModel,
    robot: RobotAspiratorModel,
    nextPathStopSearchFlag: boolean,
    intervalMs: number = 600
  ): Observable<RobotServiceDtoOut> {

    // console.log(this.robotPositionSubject);
    // if (this.robotPositionSubject.closed) {
    //   this.robotPositionSubject = new Subject<RobotServiceData>();
    // this.robotPosition$ = this.robotPositionSubject.asObservable();
    // }

    maisonModel.isNettoyageComplete = false;

    // Calculer le chemin initial
    let cheminRestant: Position[] = [];

    // Empêcher la recherche d'un nouveau chemin si le robot doit rentrer à la base par manque d'énergie
    if (!nextPathStopSearchFlag) {
      cheminRestant = this.cheminOptimalService.calculateNextPath(isRetourAlaBase, maisonModel.maison, robot.basePosition, robot.position);
      if (cheminRestant.length === 0) {
        maisonModel.isNettoyageComplete = true;
      }
    }

    // Utiliser un timer régulier pour l'animation
    return timer(0, intervalMs).pipe(
      map(() => this.processNextMove(maisonModel, robot, cheminRestant, isRetourAlaBase)),
      takeWhile(result => !result.isNettoyageComplete && robot.batterie > 0, true), // TODO: revoir conditions + à quoi sert true ?
      tap(result => {
        console.log("result - RobotServiceDtoOut");
        console.log(result);
        console.log(result.batterie);
        console.log(result.isNettoyageComplete);
        console.log(result.isRobotReturningToBase);

        if (result.positions[0] || result.positions[1]) {
          console.log(result.positions[0]);
          console.log(result.positions[0].x);
          console.log(result.positions[0].y);

          console.log(result.positions[1]);
          console.log(result.positions[1].x);
          console.log(result.positions[1].y);
        }

        // Émettre la mise à jour de position
        // if (result.positions.length > 0) {
        //   this.robotPositionSubject.next(result);
        // }
      })
    );
  }

  private processNextMove(maisonModel: MaisonModel, robot: RobotAspiratorModel, cheminRestant: Position[], isRetourAlaBase: boolean): RobotServiceDtoOut {
    console.log("########## processNextMove");
    console.log(robot);
    console.log(robot.position);
    console.log(robot.position.x);
    console.log(robot.position.y);

    let robotServiceData: RobotServiceDtoOut = {
      // on actualise ici le niveau de batterie
      batterie: robot.batterie,
      isNettoyageComplete: false,
      positions: [],
      isRobotReturningToBase: robot.isRobotReturningToBase
    };

    // Si le robot est à l'arrêt
    if (!robot.isRobotStarted) {
      console.log(robotServiceData);
      return robotServiceData;

    }
    else if (this.robotMustStop(robot)) {
      console.log("Le robot ne peut aller plus loin : batterie insuffisante !");
      console.log(robotServiceData);
      // cheminRestant = []; // TEST réinit chemin
      // robotServiceData.positions = [robot.position, robot.position];
      robot.isRobotReturningToBase = true;
      robotServiceData.isRobotReturningToBase = true;
      // robotServiceData.isNettoyageComplete = false; // TODO: GARDER ICI ?
      // Note: pas ici de return robotServiceData; (la position est actualisée plus bas)
    }
    // Sinon si la maison est nettoyée
    else if (maisonModel.isNettoyageComplete) {
      robotServiceData.isNettoyageComplete = true;
      console.log(robotServiceData);
      return robotServiceData;
    }
    // Sinon si le chemin actuel est terminé, chercher la prochaine destination
    // (cette action est valable seulement si ce n'est pas un retour à la base)
    else if (cheminRestant.length === 0 && isRetourAlaBase === false) {
      cheminRestant = this.cheminOptimalService.calculateNextPath(false, maisonModel.maison, robot.basePosition, robot.position);

      // Après calcul du nouveau chemin, actualisant this.cheminRestant, si aucune nouvelle destination n'est trouvée, le netttoyage est complet:
      if (cheminRestant.length === 0) {
        robotServiceData.isNettoyageComplete = true;
        console.log(robotServiceData);
        return robotServiceData;
      }
    }

    // Dans tous les cas : Si le chemin actuel n'est pas terminé, procéder au mouvement
    if (cheminRestant.length !== 0) {

      // Mettre à jour la position précédente
      robot.lastPosition = { ...robot.position };
      // Mettre à jour la nouvelle position avec la première position du chemin enregistré
      robot.position = { ...cheminRestant.shift()! };

      console.log(`Déplacement vers (${robot.position.x}, ${robot.position.y}). Batterie: ${robot.batterie.toFixed(1)}%`);

      robotServiceData.positions = [robot.lastPosition, robot.position];
      robotServiceData.isRobotReturningToBase = robot.isRobotReturningToBase;
      robotServiceData.isNettoyageComplete = false; // TODO: GARDER ICI ?

      robot.batterie -= robot.consommationParMouvement;
      console.log("robot batterie = " + robot.batterie);
      robotServiceData.batterie = robot.batterie;
      console.log("robotServiceData batterie = " + robotServiceData.batterie);

    }

    // Renvoyer les données du robot modifiées ou non
    return robotServiceData;
  }

  private robotMustStop(robot: RobotAspiratorModel): boolean {
    return (robot.position &&
      robot.batterie <= this.energieNecessairePourRetour(
        robot.basePosition, robot.position, robot.consommationParMouvement)
    ) ? true : false;
  }

  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(basePosition: Position, position: Position, consommationParMouvement: number): number {
    // Estimer la distance jusqu'à la base
    const distance = this.cheminOptimalService.distance(position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité
    return (distance * consommationParMouvement) * 2;
  }
}
