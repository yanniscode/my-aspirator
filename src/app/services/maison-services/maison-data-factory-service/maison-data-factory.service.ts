import { inject, Injectable, OnDestroy } from '@angular/core';
import { MaisonDataService } from '../maison-data-services/maison-data.service';
import { MaisonDataNettoyageService } from '../maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { forkJoin, map, Observable, Subject, takeUntil, tap } from 'rxjs';
import { MaisonConfig } from '../../../classes/config/maison.config';

@Injectable({
  providedIn: 'root',
})
export class MaisonDataFactoryService implements OnDestroy {

  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);
  // Pattern factory: tableau de Maison Data Services de type spécifiques vers un type générique
  private maisonDataServicesTab: MaisonDataService[] = [this.maisonDataNettoyageService];

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
    const requests$: Observable<MaisonConfig>[] = this.maisonDataServicesTab.map(maisonDataService =>

      maisonDataService.getJsonData().pipe(
        tap(maisonConfig => {
          maisonDataService.setMaisonParams(maisonConfig);
        })
      )
    );

    return forkJoin(requests$).pipe(
      takeUntil(this.endedSubscription$),
      map(() => void 0)
    );
  }
}
