import { Injectable } from '@angular/core';

import { Cell } from '../../classes/models/cell';
import { Position } from '../../classes/models/position';

@Injectable({
  providedIn: 'root'
})
export class CheminOptimalService {

  constructor() { }

  public calculateNextPath(isRetourAlaBase: boolean, maison: Cell[][], basePosition: Position, position: Position): Position[] {
    const prochaineCellule = this.trouverProchaineDestination(maison, position);
    // console.log(prochaineCellule);

    // isRetourAlaBase n'est vrai ici que si prochaineCellule est null ou undefined
    if (prochaineCellule || isRetourAlaBase) {

      let finChemin: Position = !isRetourAlaBase ? { ...prochaineCellule!.cellStack[0]!.position } : { ...basePosition };

      const chemin = this.trouverChemin(maison, position, finChemin);
      // console.log(chemin);

      return chemin.map(pos => ({ ...pos }));
      // console.log(this.cheminRestant);

      // console.log("Nouveau chemin calculé vers:", prochaineCellule.cellStack[0].position);
    } else {
      console.log("RobotAspiratorService - Aucune cellule accessible non visitée trouvée");
      // this.isNettoyageComplete = true;
      return [];
    }
  }


  // Algorithme A* pour trouver le chemin optimal
  public trouverChemin(maison: Cell[][], depart: Position, fin: Position): Position[] {
    // Structure pour représenter un nœud dans l'algorithme A*
    interface Node {
      position: Position;
      g: number; // Coût depuis le départ
      f: number; // Coût estimé total (g + h)
    }

    // Fonction pour créer une clé unique pour une position
    const positionKey = (pos: Position): string => `${pos.x},${pos.y}`;

    // Ensemble des nœuds à explorer (la file de priorité)
    const openSet: Node[] = [];

    // Ensemble des nœuds déjà explorés
    const closedSet = new Set<string>();

    // Map qui associe chaque position à son parent dans le chemin optimal
    const cameFrom = new Map<string, Position>();

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
      const current = openSet.shift()!;
      const currentKey = positionKey(current.position);

      // Si nous sommes arrivés à destination
      if (current.position.x === fin.x && current.position.y === fin.y) {
        // Reconstruire le chemin
        return this.reconstruireChemin(depart, cameFrom, fin);
      }

      // Marquer le nœud comme exploré
      closedSet.add(currentKey);

      // Explorer les voisins
      const voisins = this.obtenirCellulesAdjacentes(maison, current.position);

      for (const voisin of voisins) {
        // Ignorer les obstacles
        if (voisin.cellStack[0].type === 'X') continue;

        const voisinKey = positionKey(voisin.cellStack[0].position);

        // Ignorer si déjà exploré
        if (closedSet.has(voisinKey)) continue;

        // Calculer le nouveau score g tentative
        const tentativeGScore = gScore.get(currentKey)! + 1;

        // Vérifier si ce chemin est meilleur
        if (tentativeGScore < gScore.get(voisinKey)!) {
          // Ce chemin est meilleur, l'enregistrer
          cameFrom.set(voisinKey, current.position);
          gScore.set(voisinKey, tentativeGScore);

          // Calculer f = g + h
          const fScore = tentativeGScore + this.distance(voisin.cellStack[0].position, fin);

          // Vérifier si le voisin est déjà dans openSet
          const existingIndex = openSet.findIndex(node =>
            node.position.x === voisin.cellStack[0].position.x && node.position.y === voisin.cellStack[0].position.y
          );

          if (existingIndex !== -1) {
            // Mettre à jour les valeurs
            openSet[existingIndex].g = tentativeGScore;
            openSet[existingIndex].f = fScore;
          } else {
            // Ajouter à openSet
            openSet.push({
              position: voisin.cellStack[0].position,
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

  // Trouver la prochaine cellule accessible non visitée la plus proche
  public trouverProchaineDestination(maison: Cell[][], position: Position): Cell | null {
    // Utiliser un algorithme de recherche en largeur (BFS) pour trouver la cellule non visitée la plus proche
    const queue: { cell: Cell; distance: number }[] = [];
    const visited: Set<string> = new Set();

    const positionKey = `${position.x},${position.y}`;
    visited.add(positionKey);

    // Ajouter les cellules adjacentes à la position actuelle
    this.obtenirCellulesAdjacentes(maison, position).forEach(cell => {
      queue.push({ cell, distance: 1 });
      visited.add(`${cell.cellStack[0].position.x},${cell.cellStack[0].position.y}`);
    });

    while (queue.length > 0) {
      const { cell, distance } = queue.shift()!;

      // Si la cellule n'est pas visitée et n'est pas un obstacle, la retourner
      if (!cell.cellStack[0].visited && cell.cellStack[0].type !== 'X' && cell.cellStack[0].type !== 'B') {
        return cell;
      }

      // Si la distance est trop grande, ne pas continuer la recherche
      if (distance > 20) { // Une limite arbitraire pour éviter une boucle infinie
        continue;
      }

      // Ajouter les cellules adjacentes à la file d'attente
      this.obtenirCellulesAdjacentes(maison, cell.cellStack[0].position).forEach(adjacentCell => {
        const key = `${adjacentCell.cellStack[0].position.x},${adjacentCell.cellStack[0].position.y}`;
        if (!visited.has(key)) {
          queue.push({ cell: adjacentCell, distance: distance + 1 });
          visited.add(key);
        }
      });
    }
    return null; // Aucune cellule non visitée accessible trouvée
  }

  // Méthode pour reconstruire le chemin
  public reconstruireChemin(position: Position, cameFrom: Map<string, Position>, current: Position): Position[] {
    const chemin: Position[] = [];
    let currentPos = current;
    const positionKey = (pos: Position): string => `${pos.x},${pos.y}`;

    // Reconstruire le chemin en partant de la fin
    while (cameFrom.has(positionKey(currentPos))) {
      chemin.unshift(currentPos);
      currentPos = cameFrom.get(positionKey(currentPos))!;
    }

    // Enlever le premier nœud si c'est la position actuelle
    if (chemin.length > 0 &&
      chemin[0].x === position.x &&
      chemin[0].y === position.y) {
      chemin.shift();
    }
    return chemin;
  }

  // Obtenir les cellules adjacentes à une position
  private obtenirCellulesAdjacentes(maison: Cell[][], position: Position): Cell[] {
    const directions = [
      { dx: 0, dy: -1 }, // Nord
      { dx: 1, dy: 0 },  // Est
      { dx: 0, dy: 1 },  // Sud
      { dx: -1, dy: 0 }  // Ouest
    ];

    const cellules: Cell[] = [];

    directions.forEach(dir => {
      const newX = position.x + dir.dx;
      const newY = position.y + dir.dy;

      // Vérifier si la nouvelle position est dans les limites de la maison et si c'est un bloc de type mur
      if (newX >= 0 && newX < maison[0].length &&
        newY >= 0 && newY < maison.length &&
        "X" != maison[newY][newX].cellStack[0].type
      ) {
        cellules.push(maison[newY][newX]);
      }
    });
    return cellules;
  }

  // Calculer la distance entre deux positions (heuristique pour A*)
  public distance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Distance de Manhattan
  }
}
