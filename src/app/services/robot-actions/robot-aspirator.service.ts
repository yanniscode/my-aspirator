import { Injectable } from '@angular/core';
import { Position } from '../../classes/position';
import { PositionResult } from '../../classes/positionResult';

import { AppComponent } from '../../components/app.component';
import { concatMap, defer, delay, EMPTY, endWith, expand, from, map, Observable, of, scan, Subject, Subscription, switchMap, takeLast, takeWhile, tap, timer, toArray } from 'rxjs';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorService {

  // 3. Subject pour émettre les mises à jour de position
  private robotPositionSubject: Subject<PositionResult>;
  public robotPosition$: Observable<PositionResult>;
  // TODO: supprimer après modif de retour à la base:
  private updateSubscriptionSeDeplacerVers?: Subscription;

  isRobotStarted: boolean = false;
  // Position actuelle
  position: Position = { x: 0, y: 0 };
  lastPosition: Position = { x: 0, y: 0 };
  // Niveau de batterie (en pourcentage)
  public batterie: number = 0;

  private cheminRestant: Position[] = [];
  private isNettoyageComplete: boolean = false;

  // Combien d'énergie est consommée par mouvement
  consommationParMouvement: number = 0;
  // Combien d'énergie est nécessaire pour retourner à la base
  // TODO: utiliser ??
  // private energieRetourBase: number;

  cheminOptimalService: CheminOptimalService;

  // todo: supprimer appel à appComponent ici
  constructor(private appComponent: AppComponent) {
    this.robotPositionSubject = new Subject<PositionResult>();
    this.robotPosition$ = this.robotPositionSubject.asObservable();

    this.appComponent = appComponent;
    this.cheminOptimalService = new CheminOptimalService();
  }

  ngOnDestroy(): void {
    if (this.updateSubscriptionSeDeplacerVers) {
      this.updateSubscriptionSeDeplacerVers.unsubscribe();
    }
    // ajout:
    this.robotPositionSubject.unsubscribe();
  }

  public onPause(): void {
    if (this.updateSubscriptionSeDeplacerVers) {
      this.updateSubscriptionSeDeplacerVers.unsubscribe();
    }
    this.robotPositionSubject.unsubscribe();

    this.isRobotStarted = false;
  }

  // *************

  public nettoyerAvecControle(
    position: Position,
    lastPosition: Position,
    batterie: number,
    isRobotStarted: boolean,
    consommationParMouvement: number,
    intervalMs: number = 500
  ): Observable<PositionResult> {
    this.robotPositionSubject = new Subject<PositionResult>();
    this.robotPosition$ = this.robotPositionSubject.asObservable();

    this.position = { ...position };
    this.lastPosition = { ...lastPosition };
    this.batterie = batterie;
    this.cheminRestant = [];
    this.isNettoyageComplete = false;

    // Calculer le chemin initial
    this.calculateNextPath();

    // Utiliser un timer régulier pour l'animation
    return timer(0, intervalMs).pipe(
      map(() => this.processNextMove(isRobotStarted, consommationParMouvement)),
      takeWhile(result => !result.isNettoyageComplete && this.batterie > 0, true),
      tap(result => {
        // Émettre la mise à jour de position
        if (result.positions.length > 0) {
          this.robotPositionSubject.next(result);
        }
      })
    );
  }

  private calculateNextPath(): void {
    const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.position);

    if (prochaineCellule) {
      const chemin = this.cheminOptimalService.trouverChemin(this.position, prochaineCellule.cellStack[0].position);
      console.log(chemin);
      this.cheminRestant = chemin.map(pos => ({ ...pos }));
      console.log(this.cheminRestant);

      console.log("Nouveau chemin calculé vers:", prochaineCellule.cellStack[0].position);
    } else {
      console.log("Aucune cellule accessible non visitée trouvée");
      this.isNettoyageComplete = true;
      this.cheminRestant = [];
    }
  }


  private processNextMove(
    isRobotStarted: boolean,
    consommationParMouvement: number
  ): PositionResult {
    // Vérifier les conditions d'arrêt
    if (!isRobotStarted
      || this.batterie <= 0
      || this.batterie <= this.cheminOptimalService.energieNecessairePourRetour(this.position, this.consommationParMouvement)
      || this.isNettoyageComplete) {
      return {
        positions: [],
        isNettoyageComplete: true
      };
    }

    // Si le chemin actuel est terminé, chercher la prochaine destination
    if (this.cheminRestant.length === 0) {
      this.calculateNextPath();

      // Si aucune nouvelle destination n'est trouvée
      if (this.cheminRestant.length === 0) {
        return {
          positions: [],
          isNettoyageComplete: true
        };
      }
    }

    // Prendre la prochaine position du chemin actuel
    const nextPosition = this.cheminRestant.shift()!;
    const lastPos = { ...this.position };

    // Mettre à jour la position
    this.position = { ...nextPosition };
    this.batterie -= consommationParMouvement;

    return {
      positions: [lastPos, this.position],
      isNettoyageComplete: false
    };
  }


  // **********************


  // // Fonction principale pour nettoyer la maison : observable car setInterval()
  // public nettoyer(
  //   position: Position,
  //   lastPosition: Position,
  //   batterie: number,
  //   isRobotStarted: boolean,
  //   consommationParMouvement: number
  // ): Observable<PositionResult> {

  //   this.position = { ...position };
  //   this.lastPosition = { ...lastPosition };
  //   this.batterie = batterie;

  //   this.isRobotStarted = isRobotStarted;
  //   this.consommationParMouvement = consommationParMouvement; // Valeur arbitraire
  //   // this.energieRetourBase = 0; // Sera calculée dynamiquement

  //   // let positionResult: PositionResult = {
  //   //   positions: [],
  //   //   isNettoyageComplete: this.isNettoyageComplete
  //   // };

  //   return defer(() => this.processNettoyage(isRobotStarted, consommationParMouvement)).pipe(
  //     expand((result) =>
  //       result.isNettoyageComplete || this.batterie <= 0
  //         ? EMPTY
  //         : timer(250).pipe(
  //             switchMap(() => this.processNettoyage(isRobotStarted, consommationParMouvement))
  //           )
  //     ),
  //     scan((acc, curr) => ({
  //       positions: curr.positions, // Remplace par les positions actuelles [lastPos, currentPos]
  //       isNettoyageComplete: curr.isNettoyageComplete
  //     }), { positions: [], isNettoyageComplete: false } as PositionResult)
  //   );

  //   //   // intervalle présente pour réactualiser le chemin
  //   //   const intervalId = setInterval(() => {
  //   //     // TODO: garder ??
  //   //     // si la batterie est HS
  //   //     if (this.batterie <= this.cheminOptimalService.energieNecessairePourRetour(this.position, this.consommationParMouvement)) {
  //   //       observer.complete();
  //   //     }
  //   //     // si toutes les cellules accessibles sont visitées, on logge simplement
  //   //     if (AppComponent.toutEstNettoye()) {
  //   //       AppComponent.log("Toutes les zones accessibles sont nettoyées");
  //   //     }
  //   //     // // Chercher la prochaine cellule non visitée et s'y diriger
  //   //     const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.position);
  //   //     console.log(prochaineCellule);

  //   //     if (prochaineCellule) {

  //   //       // Utiliser A* ou un autre algorithme de recherche de chemin pour trouver le chemin optimal
  //   //       const chemin: Position[] = this.cheminOptimalService.trouverChemin(this.position, prochaineCellule.cellStack[0].position);
  //   //       if (chemin.length === 0) {
  //   //         console.log("Impossible de trouver un chemin vers la destination");
  //   //         observer.complete();
  //   //       }

  //   //       this.updateSubscriptionSeDeplacerVers = this.seDeplacerVers(chemin).subscribe({
  //   //         next: (pos: Position) => {

  //   //           if (this.position.x !== pos.x || this.position.y !== pos.y) {

  //   //             // nécessaire vérification de isRobotStarted dans la fonction synchrone appelée par une observable,
  //   //             // pour éviter de nouveaux tours de boucle à cause de la présence de setInterval() dans la fonction nettoyer()
  //   //             if (this.isRobotStarted === false) { // fait
  //   //               return;
  //   //             }
  //   //             // Mettre à jour la position
  //   //             this.position = { ...pos };
  //   //             // Réduire la batterie
  //   //             this.batterie -= this.consommationParMouvement;

  //   //             console.log(`Déplacement vers (${this.position.x}, ${this.position.y}). Batterie: ${this.batterie.toFixed(1)}%`);
  //   //             AppComponent.log(`Déplacement vers (${this.position.x}, ${this.position.y}). Batterie: ${this.batterie.toFixed(1)}%`);

  //   //             positionResult = {
  //   //               positions: [this.lastPosition, this.position],
  //   //               isNettoyageComplete: this.isNettoyageComplete
  //   //             }
  //   //             observer.next(positionResult);
  //   //           }

  //   //         },
  //   //         error: (err: string) => {
  //   //           console.log('Erreur seDeplacerVers: ' + err);
  //   //         },
  //   //         complete: () => {
  //   //           console.log('complete seDeplacerVers: ok !');
  //   //         }
  //   //       });
  //   //     } else {
  //   //       // Si aucune cellule n'est trouvée, retourner à la base
  //   //       console.log("Aucune cellule accessible non visitée trouvée");
  //   //       this.isNettoyageComplete = true;
  //   //       // force ici la fin de l'observable
  //   //       observer.complete();
  //   //     }

  //   //   }, 250); // Émet une nouvelle valeur toutes les 280ms

  //   //   // Gestion de l'annulation de l'intervalle si l'observable est désabonné
  //   //   return () => {
  //   //     clearInterval(intervalId);
  //   //   };
  //   // });

  // }


  // private processNettoyage(
  //   isRobotStarted: boolean,
  //   consommationParMouvement: number
  // ): Observable<PositionResult> {

  //   if (!isRobotStarted
  //     || this.batterie <= 0
  //     || this.batterie <= this.cheminOptimalService.energieNecessairePourRetour(this.position, this.consommationParMouvement)) {
  //     // TODO: revoir si booléen = true ici
  //     return of({
  //       positions: [],
  //       isNettoyageComplete: true,
  //     });
  //   }
  //   // if (this.batterie <= this.cheminOptimalService.energieNecessairePourRetour(this.position, this.consommationParMouvement)) {
  //   //   observer.complete();
  //   // }

  //   const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.position);
  //   // console.log(prochaineCellule);

  //   if (prochaineCellule) {

  //     // Utiliser A* ou un autre algorithme de recherche de chemin pour trouver le chemin optimal
  //     const chemin: Position[] = this.cheminOptimalService.trouverChemin(
  //       this.position,
  //       prochaineCellule.cellStack[0].position
  //     );

  //     if (chemin.length === 0) {
  //       return of({
  //         positions: [],
  //         isNettoyageComplete: true,
  //       });
  //     }

  //     return this.seDeplacerVersRx(chemin).pipe(
  //       // toArray(),
  //       map(movement => {
  //         // Extraire toutes les positions courantes du chemin
  //         // const allPositions = movements.map(movement => movement.positions[1]); // currentPosition
  //         this.batterie -= consommationParMouvement;
  //         return {
  //           positions: movement.positions,
  //           isNettoyageComplete: false,
  //         };
  //       })
  //     );

  //   }  else {
  //     // TODO: revoir si nécessaire en plus
  //     // Si aucune cellule n'est trouvée, retourner à la base
  //     console.log("Aucune cellule accessible non visitée trouvée");
  //     this.isNettoyageComplete = true;
  //     return of({
  //       positions: [],
  //       isNettoyageComplete: true
  //     });
  //   }
  // }

  // // VERSION FINALE RECOMMANDÉE
  // private seDeplacerVersRx(chemin: Position[]): Observable<PositionResult> {

  //   let result: PositionResult = {
  //     positions: [], // [lastPosition, currentPosition]
  //     isNettoyageComplete: false
  //   };
  //   // if (chemin.length === 0) {
  //   //   return of(result);
  //   // }

  //   return from(chemin).pipe(
  //     concatMap(pos => of(pos).pipe(delay(250))),
  //     map(pos => {
  //       const lastPos = { ...this.position };
  //       this.position = { ...pos };

  //       result = {
  //         positions: [lastPos, this.position], // [lastPosition, currentPosition]
  //         isNettoyageComplete: false
  //       };

  //       // Émettre la mise à jour de position
  //       this.robotPositionSubject.next(result);

  //       return result;
  //     })
  //     // toArray()
  //   );
  // }


  // ******************

  // Retourner à la base de charge
  public retournerALaBase(
    position: Position,
    lastPosition: Position,
    batterie: number,
    isRobotStarted: boolean,
    consommationParMouvement: number
  ): Observable<void> {
    return new Observable((observer) => {
      AppComponent.log("Retour à la base de charge");

      this.position = position;
      this.lastPosition = lastPosition;
      this.batterie = batterie;
      this.isRobotStarted = isRobotStarted;
      this.consommationParMouvement = consommationParMouvement; // Valeur arbitraire
      // this.energieRetourBase = 0; // Sera calculée dynamiquement

      // Trouver le chemin vers la base
      const chemin: Position[] = this.cheminOptimalService.trouverChemin(this.position, AppComponent.basePosition);
      if (chemin.length === 0) {
        AppComponent.log("Impossible de trouver un chemin vers la base de charge!");
      }

      // Suivre le chemin
      this.updateSubscriptionSeDeplacerVers = this.seDeplacerVers(chemin).subscribe({
        next: (pos) => {
          AppComponent.log('next suivreLeCheminVersLaBase...');

          // Mettre à jour la position
          this.position = { ...pos };
          // Réduire la batterie
          this.batterie -= this.consommationParMouvement;

          // console.log(`Déplacement vers (${this.position.x}, ${this.position.y}). Batterie: ${this.batterie.toFixed(1)}%`);
          AppComponent.log(`Déplacement vers (${this.position.x}, ${this.position.y}). Batterie: ${this.batterie.toFixed(1)}%`);
          // this.deplacer(pos);

          AppComponent.log("retour à la base");
          AppComponent.log("robot : X =" + this.position.x + "/ Y = " + this.position.y);
        },
        error: (err) => {
          AppComponent.log('Erreur suivreLeCheminVersLaBase: ' + err);
        },
        complete: () => {
          AppComponent.log('complete suivreLeCheminVersLaBase');
          observer.complete();
          AppComponent.log("Arrivé à la base de charge avec une batterie de " + this.batterie.toFixed(1) + "%");
        }
      });
    });
  }

  // Se déplacer vers une cellule spécifique
  private seDeplacerVers(chemin: Position[]): Observable<Position> {
    return new Observable((observer) => {
      let index = 0;

      const intervalId = setInterval(() => {
        // maj de la position actuelle, qui devient l'ancienne
        console.log(chemin);
        console.log(this.lastPosition);
        console.log(this.position);
        this.lastPosition = { ...this.position };
        // Vérifier si nous avons assez de batterie
        if (this.batterie <= this.cheminOptimalService.energieNecessairePourRetour(this.position, this.consommationParMouvement)) {
          AppComponent.log("Batterie faible, interruption du déplacement");
          observer.complete();
        }
        // Suivre le chemin
        else if (index < chemin.length) {
          observer.next(chemin[index]);
          index++;
        } else {
          observer.complete(); // Termine l'observable après avoir émis tous les nombres
        }
      }, 500);

      // Gestion de l'annulation de l'intervalle si l'observable est désabonnée
      return () => {
        clearInterval(intervalId);
      };
    });
  }

}
