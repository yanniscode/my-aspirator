import { inject, Injectable, OnDestroy, Signal } from '@angular/core';
import { MaisonDataService } from '../maison-data-services/maison-data.service';
import { MaisonDataNettoyageService } from '../maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { MaisonModel } from '../../../classes/models/maison-model/maison-model';
import { forkJoin, map, Observable, Subject, takeUntil, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MaisonDataFactoryService implements OnDestroy {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  // Pattern factory: tableau de Maison Data Services de type spécifiques vers un type générique
  private maisonDataServicesTab: MaisonDataService[] = [this.maisonDataNettoyageService];

  public readonly maisonSignal: Signal<MaisonModel> = this.maisonDataNettoyageService.maisonSignal;

  private endedSubscription$ = new Subject<void>();

  ngOnDestroy(): void {
    console.log("MaisonDataFactoryService - ngOnDestroy()");
    this.endedSubscription$.next();
    this.endedSubscription$.complete();
  }

  /**
   * Méthode de factory : renvoie les paramètres des robots avec un upcast vers le type générique RobotModel[]
   */
  public createMaisonParams(): Observable<void> {
    console.log("MaisonDataFactoryService - createMaisonParams()");

    // initialisation des paramètres des robots
    const requests$: Observable<MaisonModel>[] = this.maisonDataServicesTab.map(maisonDataService =>

      maisonDataService.getJsonData().pipe(
        tap(maisonModel => {
          maisonDataService.setMaisonParams(maisonModel);
        })
      )
    );

    return forkJoin(requests$).pipe(
      takeUntil(this.endedSubscription$),
      map(() => void 0)
    );
  }
}
