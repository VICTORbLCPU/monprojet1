# Intermed Exportation — site vitrine

Site d'une page pour Intermed Exportation, grossiste exportateur de produits pharmaceutiques basé à Hyères.

La direction artistique s'inspire du style « Column » : texte bleu marine sur fond blanc froid, vert d'eau réservé aux données, et un seul aplat orange par page (la carte « Entreprise à mission »).

## Structure

```
index.html              page unique (toutes les sections)
assets/css/styles.css   styles et variables de couleur, typo, ombres
assets/js/main.js       menu mobile, navigation, graphique du chiffre d'affaires
assets/img/world-dots.svg  carte du monde en points (illustration du haut de page)
assets/img/favicon.svg  icône du site
```

Le site est en HTML, CSS et JavaScript simples, sans étape de build. Les polices Inter et JetBrains Mono viennent de Google Fonts.

## Voir le site en local

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mise en ligne (GitHub Pages)

Le site est publié depuis la branche `main`, à la racine du dépôt. Le fichier `.nojekyll` demande à GitHub de servir les fichiers tels quels.

Adresse : https://victorblcpu.github.io/monprojet1/

Pour l'activer : **Settings → Pages → Build and deployment**, puis Source « Deploy from a branch », branche `main`, dossier `/ (root)`, et **Save**.

## Sections

1. Accueil : accroche, carte des cinq continents, chiffre d'affaires 2024
2. Reconnaissances : EcoVadis, Trophées RSE PACA, Great Place to Work, Best Managed Companies, AME
3. L'entreprise : présentation, fiche d'identité, repères de 1991 à 2026
4. Offre : quatre services et gammes de produits
5. Easymed : la plateforme de commande
6. Conformité : BPDG et ANSM, autorisation de 1993, AME
7. Chiffres clés : chiffres 2024, graphique et tableau de 2021 à 2024
8. Engagements : raison d'être, valeurs, engagements, distinctions
9. Gouvernance
10. Contact, avec l'identité légale dans le pied de page

La page `mentions-legales.html` contient l'éditeur, l'hébergeur (GitHub, Inc.), la propriété intellectuelle et les données personnelles.

## Points restants

- **Easymed** : le lien pointe vers https://easymed.market, qui affiche aujourd'hui une page d'erreur vue de l'extérieur.
- **Téléphone de l'hébergeur** : la LCEN demande le téléphone de l'hébergeur, que GitHub ne publie pas clairement. La page renvoie pour l'instant vers support.github.com.
- **Formulaire** : le site n'en a volontairement aucun. Le contact se fait par téléphone ou par e-mail.
