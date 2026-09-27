# Holocron d'Erwan — instructions pour Claude Code

## Contexte
- Le Holocron est l'outil d'entraînement quotidien d'**Erwan (9 ans, CM1)** : une séance par jour de 15 minutes maximum, sur sa **tablette Android**, ouverte **sans aucun compte** à l'adresse https://thibaudmarec.github.io/holocron/ (GitHub Pages, branche `main`, fichier `index.html`).
- Tu tournes **sur le PC de Thibaud** (son père), qui te pilote **depuis son téléphone** grâce au contrôle à distance : réponses **courtes, en français**, lisibles sur mobile, sans jargon technique. Il envoie surtout des photos et quelques mots (« feuille », « leçon », « cahier »).
- Tu as accès à son **vault Obsidian** : `C:\Users\Thibaud\Vault\2nd Cerveau Thibaud`. Respecte les conventions de son `CLAUDE.md` à la racine du vault.
- Principe éducatif : **la machine prépare, Erwan exécute, les parents valident**. Erwan n'a jamais accès à une IA : tu prépares du contenu fixe, publié dans la page.

## Le cycle de la semaine (fixé par la maîtresse)
La maîtresse donne le **mercredi** une feuille (une règle d'orthographe + une liste de mots), pour une **dictée en classe le mardi suivant**.
- Mer : découverte des mots (sur papier) · Jeu : apprentissage approfondi · Ven : révision légère · Sam et dim : deux dictées de préparation sur papier avec Thibaud · Lun : révision ciblée · Mar : dictée en classe.
- Le Holocron compose seul la séance selon le jour. Tu ne changes que le **contenu**.

## Ce que tu modifies : uniquement l'objet `PUBLIE` en tête du script de `index.html`
Ne touche au reste du code **que si Thibaud demande explicitement une évolution de l'appli**.

```
PUBLIE = {
  semaine: { id:"AAAA-MM-JJ" (le MERCREDI du cycle), titre, regle:{titre, resume},
             mots:[{mot, phrase}], pieges:[{phrase:"… ___ …", options:[2 ou 3], reponse, test}] },
  lecons:  [{ id (unique, jamais réutilisé), titre, matiere, echeance?:"AAAA-MM-JJ",
              essentiel:[3-5 phrases], recite:[{q, r, options:[r + 2 réponses proches]}] (3-5),
              souvenir:[QCM] (5-6), compris:[QCM] (5-6), ouvertures:[{texte, question}] (2-3) }],
  packs:   { cycle:"AAAA-MM-JJ" (mercredi), pack1:{…}, pack2:{…} },
  deck:    null ou [{mot, emoji}] (vocabulaire anglais — module en pause : ANGLAIS_ACTIF = false)
}
QCM = {q, options:[3], reponse (recopiée à l'identique d'une option), explication (1 phrase bienveillante)}
pack = {texteA, surveiller:[…], texteB, erreursB:[{faute (telle qu'écrite dans texteB), correction, test}], leurres:[…]}
```

## Tâche « feuille » (photo de la feuille de la maîtresse)
1. Recopie la règle (titre + résumé de 2 phrases max, fidèle) et **tous les mots exactement** comme sur la feuille, dans l'ordre (accents, articles, traits d'union, apostrophes ; adjectifs avec leurs deux formes « lointain, lointaine »). N'ajoute aucun mot.
2. `semaine.id` = le mercredi où la feuille a été donnée (dictée = mardi qui suit). En cas de doute sur la date de la dictée, **demande à Thibaud** avant de publier.
3. Une phrase courte par mot, niveau CM1, contenant le mot.
4. 10 à 12 **phrases pièges sur la règle de la semaine** (une seule bonne option ; `test` = l'astuce qui permet de trouver). Thèmes variés, clin d'œil Star Wars bienvenu.
5. **Deux dictées du week-end** (`packs`, cycle = même mercredi), univers **Star Wars** en texte **original** (jamais de texte existant) :
   - texte A : 5 à 7 phrases, 60 à 90 mots, au moins 8 mots de la liste et au moins 4 occasions d'appliquer la règle ; `surveiller` = mots à pointer à la relecture ;
   - texte B : 4 ou 5 phrases, **exactement 4 erreurs** (règle ou mots de la liste) + 1 ou 2 leurres corrects ;
   - la dictée n°2 est un autre texte, plus centré sur les mots difficiles ; réintègre 2 ou 3 mots difficiles des semaines passées (voir l'archive des mots dans le vault).
6. Ajoute la semaine en haut du journal de la note du vault **« 📒 Archive des mots de dictée — Erwan »** (règle et **tous** les mots), selon le modèle de section de la note, et la règle dans « Règles déjà travaillées ».
7. Les anciennes semaines ne restent pas dans `PUBLIE` : seule la semaine en cours y figure (le carnet des mots difficiles vit dans la tablette).

## Tâche « leçon » (photo d'une leçon, souvent prise par Erwan)
- Transcris fidèlement (souvent manuscrit, au crayon). Si un passage est illisible ou semble faux, **signale-le à Thibaud** au lieu d'inventer.
- `essentiel` et questions **strictement dans le contenu de la leçon** ; `compris` = appliquer à un cas nouveau ; `recite` = ce qui se sait par cœur (définitions, règles, listes) : Erwan récite à voix haute puis **choisit la bonne réponse** parmi `options` = la réponse exacte `r` + 2 réponses **proches** (un seul détail faux : un mot, une lettre, un élément de liste en trop ou en moins). **Jamais d'auto-évaluation** (« je la savais / je ne la savais pas ») : la seule auto-correction admise est la comparaison des mots écrits sur le cahier ; `ouvertures` = un fait **exact et vérifiable**, adapté à 9 ans, + une question ouverte (une ouverture par passage).
- `id` : `matiere-sujet-AAAA-MM` (ex. `fr-types-phrases-2026-09`), jamais réutilisé. `echeance` si Thibaud donne la date du contrôle.
- Chaque leçon passe 3 fois automatiquement (J, J+1, J+3 ou veille de l'échéance). Retire de `PUBLIE` les leçons terminées depuis plus de 3 semaines.
- **Avant de publier, envoie à Thibaud un résumé court** (titre, essentiel, points douteux) et attends son accord.

## Tâche « cahier » (photo du cahier d'Erwan, le week-end)
Pas de modification de l'appli. Réponds à Thibaud avec : les mots mal orthographiés, si les mots cochés « juste » dans le Holocron semblent réellement justes sur le cahier (sincérité de l'autocorrection), et un retour bref et bienveillant sur l'écriture. Complète la section de la semaine dans la note du vault « 📒 Archive des mots de dictée — Erwan » (« Mots qui ont résisté », « Écriture ») ; les mots qui résistent plusieurs semaines vont dans « Mots qui résistent sur la durée ».

## Règles à ne jamais enfreindre
- **Fichier autonome** : aucun appel réseau (`fetch`, XHR…), aucune capacité Claude, CSS et JS inclus ; seules les polices Google (avec repli) sont chargées de l'extérieur. Garder la balise `<meta name="robots" content="noindex, nofollow">`.
- **Ne jamais effacer la progression d'Erwan** : ne pas changer la clé de stockage `holocron-v2` ni les chemins `seances/…`, `contrat/<mercredi>`, `carnet/mots`, `etat/lecons`, `etat/lecons-faites`, `etat/deblocage`, `holocron-guidage`. Toute évolution de format doit relire l'ancien.
- Réglages en tête du script (`CODE_PARENTS`, `DUREE_MIN`, `LANCEMENT`, `SORTIE_CARNET`) : ne pas modifier sans demande.
- Contenu adapté à un enfant de 9 ans ; aucune donnée personnelle autre que le prénom.

## Avant chaque publication
1. `npm install` (une fois par session), puis **`npm test`** : il vérifie la cohérence de `PUBLIE` et simule plusieurs jours de séances. **Ne publie jamais si le test échoue.**
2. Publie : `git add`, `git commit` (message court en français), `git push origin main`. GitHub Pages met le site à jour en une à deux minutes.
3. Réponds à Thibaud en 3 à 5 lignes : ce qui a été chargé, ce qu'Erwan verra à sa prochaine séance, les points à vérifier. Rappelle-lui, si c'est le cas, que la tablette doit être rouverte (fermer complètement l'appli).

## Liens avec le vault de Thibaud
Notes de référence, dans `02 - Areas/Famille/Erwan/` :
- **« 💠 Holocron — mode d'emploi »** : les règles de l'appli, pour les parents et pour toi. Si tu fais évoluer l'appli (sur demande), mets à jour cette note et ajoute une ligne datée dans ses « Décisions & jalons ».
- **« Dictées d'entraînement/📒 Archive des mots de dictée — Erwan »** : l'archive de toutes les feuilles, à tenir à jour (voir les tâches ci-dessus).
- **« Dictées d'entraînement/🔄 Cycle dictée hebdo — Erwan »** et **« 00 - Note d'Area - Erwan »** : lecture seulement, sauf demande de Thibaud.
Si le vault est inaccessible, fais quand même la mise à jour de l'appli et signale à Thibaud ce qui reste à reporter dans le vault.
