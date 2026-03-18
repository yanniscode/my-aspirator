import { Injectable } from "@angular/core";
import { Subscription, Observable, Subscriber, Subject, takeUntil, tap, finalize, timer, map, takeWhile } from "rxjs";
import { RobotServiceDtoOut } from "../../../../classes/dtos/robot-service-dto-out";
import { GridPosition } from "../../../../classes/models/grid-position";
import { MaisonModel } from "../../../../classes/models/maison-model";
import { RobotAspiratorModel } from "../../../../classes/models/robot-aspirator-model";
import { AlgoCheminOptimalService } from "../../../algos-deplacement-services/algo-chemin-optimal.service";
import { LoggerService } from "../../../data-services/logger-service/logger.service";

@Injectable() // Pas de providedIn: 'root' car on veut une instance du service par composant appelant RobotAspiratorComponent, pas un singleton
export class RobotAspiratorWithNextPositionsTabService {

  // Nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  private maisonModel: MaisonModel;
  private robot: RobotAspiratorModel;
  private robotServiceDtoOut: RobotServiceDtoOut;

  constructor(private loggerService: LoggerService, private algoCheminOptimalService: AlgoCheminOptimalService) {
    console.log("RobotAspiratorWithNextPositionsTabService - constructor()");

    this.maisonModel = new MaisonModel();
    this.robot = new RobotAspiratorModel();
    this.robotServiceDtoOut = new RobotServiceDtoOut();
  }

  public onPauseRobotService(): RobotAspiratorModel {
    console.log("RobotAspiratorWithNextPositionsTabService - onPauseRobotService()");

    this.subscription?.unsubscribe();

    this.robot.isRobotStarted = false;

    return this.robot;
  }

  // Fonction principale pour nettoyer la maison
  public onStartNettoyer(maisonModelInput: MaisonModel, robotInput: RobotAspiratorModel): Observable<RobotServiceDtoOut> {
    console.log("RobotAspiratorWithNextPositionsTabService - onStartNettoyer()");

    this.maisonModel = { ...maisonModelInput };

    console.log("robot datas:");
    RobotAspiratorModel.logger(robotInput);
    this.robot = { ...robotInput };
    console.log("this.robot datas:");
    RobotAspiratorModel.logger(this.robot);

    return new Observable<RobotServiceDtoOut>((observer) => {
      // console.log(this.subscription);
      if (!this.subscription || this.subscription.closed) {
        console.log("onStartNettoyer new subscription !")
        this.subscription = new Subscription();
      }

      // TODO: revoir si il faudrait actualiser aussi le robot pour la cohérence des données:
      // robot.isRobotStarted = true;

      // en cas de mise en pause
      if (!this.robot.isRobotStarted) {
        observer.complete();
        return;
      }

      // Méthode principale de nettoyage de la maison
      this.nettoyerAvecControleSouscription(observer);
    });
  }

  private nettoyerAvecControleSouscription(observer: Subscriber<RobotServiceDtoOut>): void {
    console.log("RobotAspiratorWithNextPositionsTabService - nettoyerAvecControleSouscription()");

    console.log("Début du nettoyage");
    console.log(`Batterie: ${this.robot.batterie}%.`);

    const stopNettoyer$ = new Subject<void>();

    let nextPathStopSearchFlag: boolean = false; // TODO: revoir si le flag est nécessaire à présent, ou si refacto possible de la variable dans la classe

    if (this.robot.batterie <= 0) {
      console.log("1/ Batterie insuffisante : retour à la base de charge nécessaire...");
      // on active le flag stoppant la recherche d'un nouveau chemin,
      // si le robot n'a pas l'énergie nécessaire pour continuer
      nextPathStopSearchFlag = true;
    }

    this.subscription = this.nettoyerAvecControle(
      nextPathStopSearchFlag
    ).pipe(
      takeUntil(stopNettoyer$), // L'Observable continue jusqu'à ce que stopNettoyer$ émette
      tap((robotServiceDtoResult: RobotServiceDtoOut) => {
        console.log('*** tap() nettoyerAvecControleSouscription...');

        console.log("robotServiceDto :");
        RobotServiceDtoOut.logger(robotServiceDtoResult);
        this.robotServiceDtoOut = { ...robotServiceDtoResult };
        console.log("this.robotServiceDtoOut :");
        RobotServiceDtoOut.logger(this.robotServiceDtoOut);

        if (this.robotServiceDtoOut.isRobotReturningToBase) {
          console.log('*** Le robot rentre actuellement à la base : Pas de reprise du nettoyage ***');
          // on active le flag pour entreprendre la recherche du chemin de retour
          nextPathStopSearchFlag = false;
          stopNettoyer$.next(); // Déclenche l'arrêt
          return;

        } else if (!this.robotServiceDtoOut.positions.length) {
          console.log('*** Aucun chemin trouvé ***');
          stopNettoyer$.next();
          return;
        }
        else if (this.robotServiceDtoOut!.isNettoyageComplete === true) {
          console.log('Nettoyage terminé !');
          stopNettoyer$.next();
          return;
        }
        else {
          // Continuer le nettoyage
          this.robot.lastPosition = { col: this.robotServiceDtoOut!.positions[0]!.col, row: this.robotServiceDtoOut!.positions[0]!.row };
          this.robot.position = { col: this.robotServiceDtoOut!.positions[1]!.col, row: this.robotServiceDtoOut!.positions[1]!.row };
          this.robot.batterie = this.robotServiceDtoOut!.batterie;
          this.robot.isRobotReturningToBase = this.robotServiceDtoOut.isRobotReturningToBase;

          console.log("nettoyerAvecControle() - this.robot après modif datas:");
          RobotAspiratorModel.logger(this.robot);

          console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(this.robot.position));
        }

        try {
          observer.next(this.robotServiceDtoOut);
        } catch (error) {
          console.log("Erreur lors de l'émission de la position: " + error);
        }
      }),
      finalize(() => {
        // Ce bloc s'exécute UNE SEULE FOIS à la fin
        console.log('complete nettoyerAvecControleSouscription: Nettoyage ok ou batterie insuffisante !');
        console.log("nettoyerAvecControle() - this.robot finalize() datas:");
        RobotAspiratorModel.logger(this.robot);

        console.log("*** Retour à la base ***");

        if (this.robot.isRobotStarted) {
          this.robot.isRobotReturningToBase = this.robotServiceDtoOut.isRobotReturningToBase;
          this.retournerALaBaseSouscription(observer);
          stopNettoyer$.complete(); // Nettoyer le Subject
        }
      })
    ).subscribe({
      error: (err: string) => {
        console.log('Erreur nettoyer: ' + err);
        stopNettoyer$.complete(); // Nettoyer le Subject même en cas d'erreur
      }
    });
  }

  private retournerALaBaseSouscription(observer: Subscriber<RobotServiceDtoOut>): void {
    console.log("RobotAspiratorWithNextPositionsTabService - retournerALaBaseSouscription()");
    console.log("this.robot datas début:");
    RobotAspiratorModel.logger(this.robot);

    // On n'active pas ici le flag annulant la recherche d'un nouveau chemin
    // Donc, si le robot n'a pas l'énergie nécessaire pour continuer, on recherche quand même le chemin du retour
    // TODO: revoir si utile:
    let nextPathStopSearchFlag: boolean = false;

    this.subscription = this.nettoyerAvecControle(
      nextPathStopSearchFlag
    ).subscribe({
      next: (robotServiceDtoResult: RobotServiceDtoOut) => {
        console.log('next nettoyerAvecControle...');

        RobotServiceDtoOut.logger(robotServiceDtoResult);
        this.robotServiceDtoOut = { ...robotServiceDtoResult };
        RobotServiceDtoOut.logger(this.robotServiceDtoOut);

        if (!this.robotServiceDtoOut!.positions.length) {
          console.log('*** Aucune position trouvée pour le robot (lastPosition, position) ***');
          this.subscription!.unsubscribe();
          observer.complete();
          return;
        }
        else if (this.robotServiceDtoOut!.batterie < 0) {
          this.log('Batterie à plat ! Robot en panne...');
          this.subscription!.unsubscribe();
          observer.complete();
          return;
        }

        // Continuer le retour à la base
        this.robot.lastPosition = { col: this.robotServiceDtoOut!.positions[0]!.col, row: this.robotServiceDtoOut!.positions[0]!.row };
        this.robot.position = { col: this.robotServiceDtoOut!.positions[1]!.col, row: this.robotServiceDtoOut!.positions[1]!.row };
        this.robot.batterie = this.robotServiceDtoOut!.batterie;

        console.log("nettoyerAvecControle() - next: this.robot datas début");
        RobotAspiratorModel.logger(this.robot);

        console.log("Energie nécessaire au retour =" + this.energieNecessairePourRetour(this.robot.position));

        try {
          observer.next(this.robotServiceDtoOut);
        } catch (error) {
          console.log("Erreur lors de l'émission de la position: " + error);
        }

      },
      error: (err: string) => {
        console.log('Erreur retournerALaBase: ' + err);
      },
      complete: () => {
        console.log('complete retournerALaBase: ok !');
        this.robot.isRobotStarted = false;
        observer.complete();
      }
    });
  }

  // TODO: à simplifier ?
  private nettoyerAvecControle(
    nextPathStopSearchFlag: boolean,
    intervalMs: number = 600
  ): Observable<RobotServiceDtoOut> {
    console.log("RobotAspiratorWithNextPositionsTabService - nettoyerAvecControle()");

    this.maisonModel.isNettoyageComplete = false;

    // Calculer le chemin initial
    let cheminRestant: GridPosition[] = [];

    // Empêcher la recherche d'un nouveau chemin si le robot doit rentrer à la base par manque d'énergie
    if (!nextPathStopSearchFlag) {
      cheminRestant = this.algoCheminOptimalService.calculerCheminSuivant(
        this.robot.isRobotReturningToBase, this.maisonModel.maison, this.robot.basePosition, this.robot.position
      );

      console.log("cheminRestant :");
      console.log(cheminRestant);
      console.log(cheminRestant[0]);
      console.log(cheminRestant[0].col);
      console.log(cheminRestant[0].row);

      if (cheminRestant.length === 0) {
        this.maisonModel.isNettoyageComplete = true;
      }
    }

    // Utiliser un timer régulier pour l'animation
    return timer(0, intervalMs).pipe(
      map(() => this.declencherMouvementSuivant(cheminRestant)),
      takeWhile(result => !result.isNettoyageComplete && this.robot.batterie > 0, true), // TODO: revoir conditions + à quoi sert true ?
      tap({
        next: (robotServiceDtoResult: RobotServiceDtoOut) => {
          console.log("result - robotServiceDtoResult :");
          RobotServiceDtoOut.logger(robotServiceDtoResult);
        }
      })
    );
  }

  private declencherMouvementSuivant(cheminRestant: GridPosition[]): RobotServiceDtoOut {
    console.log("RobotAspiratorWithNextPositionsTabService - declencherMouvementSuivant()");

    console.log("*** cheminRestant : ***");
    console.log(cheminRestant[0]);
    console.log(cheminRestant[0]?.col);
    console.log(cheminRestant[0]?.row);

    console.log("this.robot :");
    RobotAspiratorModel.logger(this.robot);

    this.robotServiceDtoOut = {
      // on actualise ici le niveau de batterie
      batterie: -1,
      isNettoyageComplete: false, // TODO : test avec this.maisonModel.isNettoyageComplete pour voir si on peut se passer de cette valeur dans RobotServiceDtoOut
      positions: [], // TODO : test avec valeur ?
      isRobotReturningToBase: false
    };

    // Si le robot est à l'arrêt
    if (!this.robot.isRobotStarted) {
      console.log(this.robotServiceDtoOut);
      RobotServiceDtoOut.logger(this.robotServiceDtoOut);
      return this.robotServiceDtoOut;
    }
    else if (this.robotMustStop(this.robot.position)) {
      console.log("Le robot ne peut aller plus loin : batterie insuffisante !");
      RobotServiceDtoOut.logger(this.robotServiceDtoOut);

      // Dans tous les cas : si le chemin actuel n'est pas terminé, procéder au mouvement
      if (cheminRestant.length !== 0) {
        // Mettre à jour la position précédente
        const lastPosition = { ...this.robot.position };
        // Mettre à jour la nouvelle position avec la première position du chemin enregistré
        const position = { ...cheminRestant.shift()! };

        this.updateRobotServiceDtoOut(lastPosition, position);
      }

      // robot.isRobotReturningToBase = true; // TODO: mettre à jour le robot ?
      this.robotServiceDtoOut.isRobotReturningToBase = true;
      return this.robotServiceDtoOut;
    }
    // Sinon si la maison est nettoyée
    else if (this.maisonModel.isNettoyageComplete) {
      this.robotServiceDtoOut.isNettoyageComplete = this.maisonModel.isNettoyageComplete
      RobotServiceDtoOut.logger(this.robotServiceDtoOut);
      this.robotServiceDtoOut.isRobotReturningToBase = true;
      return this.robotServiceDtoOut;
    }
    // Sinon si le chemin actuel est terminé, chercher la prochaine destination
    // (cette action est valable seulement si ce n'est pas un retour à la base)
    else if (cheminRestant.length === 0 && this.robot.isRobotReturningToBase === false) {
      cheminRestant = this.algoCheminOptimalService.calculerCheminSuivant(false, this.maisonModel.maison, this.robot.basePosition, this.robot.position);
      // Si aucune nouvelle destination n'est trouvée, le netttoyage est complet :
      if (cheminRestant.length === 0) {
        console.log("Aucun chemin trouvé !")
        this.robotServiceDtoOut.isNettoyageComplete = true;
        this.robotServiceDtoOut.isRobotReturningToBase = true;
        RobotServiceDtoOut.logger(this.robotServiceDtoOut);
        return this.robotServiceDtoOut;
      }
    }

    // Dans les cas passants : si le chemin actuel n'est pas terminé, procéder au mouvement
    if (cheminRestant.length !== 0) {
      // Après calcul du nouveau chemin:
      // Si la position suivante est trop loin, par rapport au niveau de batterie :
      if (this.robotMustStop(cheminRestant[0])) {
        console.log('Pas assez de batterie pour avancer d\'une case supplémentaire !');
        this.robotServiceDtoOut.isRobotReturningToBase = true;
        return this.robotServiceDtoOut;
      }
      // Mettre à jour la position précédente
      const newLastPosition = { ...this.robot.position };
      // Mettre à jour la nouvelle position avec la première position du chemin enregistré
      const nextPosition = { ...cheminRestant.shift()! };

      this.updateRobotServiceDtoOut(newLastPosition, nextPosition);
    }

    // Renvoyer les données du robot modifiées ou non
    console.log("processNextMove() - fin");
    RobotServiceDtoOut.logger(this.robotServiceDtoOut);

    return this.robotServiceDtoOut;
  }

  private updateRobotServiceDtoOut(lastPosition: GridPosition, position: GridPosition): void {
    console.log("RobotAspiratorWithNextPositionsTabService - updateRobotServiceDtoOut()");

    console.log(`Déplacement vers (${lastPosition.col}, ${position.row}). Batterie: ${this.robot.batterie.toFixed(1)}%`);

    this.robotServiceDtoOut.isNettoyageComplete = this.maisonModel.isNettoyageComplete;
    this.robotServiceDtoOut.positions = [{ ...lastPosition }, { ...position }];
    this.robotServiceDtoOut.isRobotReturningToBase = this.robot.isRobotReturningToBase;
    this.robotServiceDtoOut.isNettoyageComplete = false;

    this.robotServiceDtoOut.batterie = this.robot.batterie - this.robot.consommationParMouvement;
    console.log("this.robotServiceDtoOut batterie = " + this.robotServiceDtoOut.batterie);
  }

  private robotMustStop(position: GridPosition): boolean {
    console.log("RobotAspiratorWithNextPositionsTabService - robotMustStop");

    return (position && this.robot.batterie <= this.energieNecessairePourRetour(position)) ?
      true : false;
  }

  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(position: GridPosition): number {
    console.log("RobotAspiratorWithNextPositionsTabService - energieNecessairePourRetour()");

    // Estimer la distance jusqu'à la base
    const distance = this.algoCheminOptimalService.distance(position, this.robot.basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité : valeur à ajuster si le robot reste bloqué (ex: consommationParMouvement = 1.2, robot4 : batterie = 20)
    return (distance * this.robot.consommationParMouvement) * 1.5;
  }

  public log(message: string) {
    this.loggerService.add(`RobotAspiratorWithNextPositionsTabService: ${message}`);
  }
}
