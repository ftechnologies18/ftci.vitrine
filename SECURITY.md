# Politique de sécurité — FTCI

## Signaler une vulnérabilité

Si vous découvrez une vulnérabilité de sécurité dans un projet ou service de **FTCI (Freelance Technologies Côte d'Ivoire)**, nous vous remercions de nous la signaler de manière responsable.

### Comment nous contacter

- **E-mail** : [freelancetechnologies.ci@gmail.com](mailto:freelancetechnologies.ci@gmail.com)
- **Langues acceptées** : Français, Anglais

### Ce que nous vous demandons

1. **Ne pas** modifier ou accéder aux données utilisateurs
2. **Ne pas** effectuer d'attaques de déni de service (DoS/DDoS)
3. **Limiter** vos tests au strict minimum nécessaire pour démontrer la vulnérabilité
4. **Ne pas** divulguer la vulnérabilité publiquement avant qu'elle soit corrigée

### Notre engagement

| Action                         | Délai                              |
| ------------------------------ | ---------------------------------- |
| Accusé de réception            | 48 heures                          |
| Mise à jour sur la progression | 72 heures                          |
| Correction (critique)          | 7 jours                            |
| Correction (modérée)           | 14 jours                           |
| Correction (faible)            | 30 jours                           |
| Crédit public                  | Sur demande (sauf refus explicite) |

### Périmètre

Sont couverts par cette politique :

- **Site web** : [ftci.fr](https://ftci.fr)
- **Applications SaaS** : SECT, OPUC, CATS, ScolaGest
- **Infrastructure** : APIs, sous-domaines, services cloud
- **Code source** : [github.com/ftechnologies18](https://github.com/ftechnologies18)

### Sévérité des vulnérabilités

| Sévérité     | Exemples                                                                  |
| ------------ | ------------------------------------------------------------------------- |
| **Critique** | RCE, injection SQL sans authentification, exposition de données sensibles |
| **Modérée**  | XSS stored, CSRF sur actions sensibles, élévation de privilèges           |
| **Faible**   | XSS réfléchi, headers manquants, informations d'erreur verbose            |

Nous utilisons le standard [CVSS v3.1](https://www.first.org/cvss/v3.1/) pour évaluer la sévérité.

---

_Notre fichier `security.txt` est accessible à :_

- *https://ftci.fr/.well-known/security.txt (canonique)*
- *https://ftci.fr/security.txt (miroir)*
