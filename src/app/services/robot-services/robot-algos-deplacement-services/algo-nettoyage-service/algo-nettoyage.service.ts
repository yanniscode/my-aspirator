import { inject, Injectable } from '@angular/core';
import { GridPosition } from '../../../../classes/models/grid-position';
import { CellElement } from '../../../../classes/models/cellElement';
import { LoggerService } from '../../../main-services/logger-service/logger.service';
import { AlgoCheminOptimalService } from '../../../main-services/algos-deplacement-services/algo-chemin-optimal.service';

@Injectable({
  providedIn: 'root'
})
export class AlgoNettoyageService extends AlgoCheminOptimalService {

  protected loggerService: LoggerService = inject(LoggerService);

  constructor() {
    super();
  }

  // Trouver la prochaine cellule accessible non visitée la plus proche
  public override trouverProchaineDestination(maison: CellElement[][], position: GridPosition): CellElement | null {
    // console.log("AlgoNettoyageService - trouverProchaineDestination()");

    // Utiliser un algorithme de recherche en largeur (BFS) pour trouver la cellule non visitée la plus proche
    // Cellules adjacentes:
    const queue: { cellElement: CellElement; distance: number }[] = [];
    // Positions visitées:
    const visited: Set<string> = new Set();

    // Ajout de la position actuelle aux positions visitées:
    const positionKey: string = `${position.col},${position.row}`;
    visited.add(positionKey);

    // Recherche des cases adjacentes à la position actuelle
    // On ne les ajoute à la queue que si elles ne sont pas réservées par un autre robot
    this.obtenirCellulesAdjacentes(maison, position).forEach(cellElement => {
      if (!cellElement.reserved) {
        queue.push({ cellElement: cellElement, distance: 1 });
        visited.add(`${cellElement.position.col},${cellElement.position.row}`);
      }
    });

    // On ajoute la position adjacente à la queue
    // On refait l'opération jusqu'à ce qu'on aie trouvé une case non-visitée
    while (queue.length > 0) {
      const { cellElement: cellElement, distance } = queue.shift()!;

      // Si la cellule n'est pas encore visitée et n'est pas un obstacle, la retourner
      if (!cellElement.visited && cellElement.type !== 'X' && cellElement.type !== 'B') {
        return cellElement;
      }

      // TODO: REVOIR LE CHIFFRE SI NÉCESSAIRE
      // Si la distance est trop grande, ne pas continuer la recherche
      if (distance > 20) { // Une limite arbitraire pour éviter une boucle infinie
        continue;
      }

      // Ajouter les cellules adjacentes à la file d'attente
      this.obtenirCellulesAdjacentes(maison, cellElement.position).forEach(adjacentCell => {
        const key = `${adjacentCell.position.col},${adjacentCell.position.row}`;
        if (!visited.has(key)) {
          queue.push({ cellElement: adjacentCell, distance: distance + 1 });
          visited.add(key);
        }
      });
    }
    return null; // Aucune cellule non visitée accessible trouvée
  }

  // Algorithme A* pour trouver le chemin optimal
  public override trouverChemin(maison: CellElement[][], depart: GridPosition, fin: GridPosition): GridPosition[] {
    // console.log("AlgoNettoyageService - trouverChemin()");

    // Structure pour représenter un nœud dans l'algorithme A*
    interface Node {
      position: GridPosition;
      g: number; // Coût depuis le départ
      f: number; // Coût estimé total (g + h)
    }

    // Fonction pour créer une clé unique pour une position
    const positionKey = (pos: GridPosition): string => `${pos.col},${pos.row}`;

    // Ensemble des nœuds à explorer (la file de priorité)
    const openSet: Node[] = [];

    // Ensemble des nœuds déjà explorés
    const closedSet = new Set<string>();

    // Map qui associe chaque position à son parent dans le chemin optimal
    const cameFrom = new Map<string, GridPosition>();

    // Map qui stocke le coût g pour chaque position
    const gScore = new Map<string, number>();

    // Initialiser gScore avec des valeurs infinies
    for (let y = 0; y < maison.length; y++) {
      for (let x = 0; x < maison[0].length; x++) {
        gScore.set(`${x},${y}`, Infinity);
      }
    }

    // Coût du départ au départ est 0
    gScore.set(positionKey(depart), 0);

    // Ajouter le nœud de départ à openSet
    openSet.push({
      position: depart,
      g: 0,
      f: this.distance(depart, fin)
    });

    // Tant qu'il y a des nœuds à explorer
    while (openSet.length > 0) {
      // Trier openSet pour obtenir le nœud avec le plus petit f
      openSet.sort((a, b) => a.f - b.f);

      // Récupérer le nœud avec le plus petit f
      const current: Node = openSet.shift()!;
      const currentKey = positionKey(current.position);

      // Si nous sommes arrivés à destination
      if (current.position.col === fin.col && current.position.row === fin.row) {
        // Reconstruire le chemin
        return this.reconstruireChemin(depart, cameFrom, current.position);
      }

      // Marquer le nœud comme exploré
      closedSet.add(currentKey);

      // Explorer les voisins
      const voisins = this.obtenirCellulesAdjacentes(maison, current.position);

      for (const voisin of voisins) {
        // Ignorer les obstacles
        if (voisin.type === 'X') continue;

        const voisinKey = positionKey(voisin.position);

        // Ignorer si déjà exploré
        if (closedSet.has(voisinKey)) continue;

        // Calculer le nouveau score g tentative
        let tentativeGScore = gScore.get(currentKey)! + 1;

        // Vérifier si ce chemin est meilleur
        if (tentativeGScore < gScore.get(voisinKey)!) {
          // Ce chemin est meilleur, l'enregistrer
          cameFrom.set(voisinKey, current.position);
          gScore.set(voisinKey, tentativeGScore);

          // Calculer f = g + h
          const fScore = tentativeGScore + this.distance(voisin.position, fin);

          // Vérifier si le voisin est déjà dans openSet
          const existingIndex = openSet.findIndex(node =>
            node.position.col === voisin.position.col && node.position.row === voisin.position.row
          );

          if (existingIndex !== -1) {
            // Mettre à jour les valeurs
            openSet[existingIndex].g = tentativeGScore;
            openSet[existingIndex].f = fScore;
          } else {
            // Ajouter à openSet
            openSet.push({
              position: voisin.position,
              g: tentativeGScore,
              f: fScore
            });
          }
        }
      }

      // Protection anti-boucle infinie
      if (openSet.length > maison.length * maison[0].length) {
        console.error("Détection de boucle potentielle dans A*");
        break;
      }
    }
    // Aucun chemin trouvé
    console.log("Aucun chemin trouvé de", depart, "à", fin);
    return [];
  }

  private log(message: string) {
    this.loggerService.add(`AlgoNettoyageService: ${message}`);
  }
}
