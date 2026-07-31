/**
 * Sérialisation JSON sécurisée pour injection dans un `<script type="application/ld+json">`.
 *
 * `JSON.stringify()` seul n'échappe pas `<`, `>`, `&` ni les séparateurs de ligne
 * U+2028 / UU+2029. Si une valeur contrôlée par un éditeur (titre d'article,
 * description, auteur, tag) contient la séquence `</script>`, elle casse le
 * bloc script et permet une injection HTML (XSS stocké).
 *
 * Cette fonction échappe ces caractères en séquences `\u00XX` qui sont valides
 * en JSON mais inoffensives en HTML. À utiliser pour tout `set:html` de JSON
 * destiné à un `<script>` inline.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 */
export function safeJsonStringify(value: unknown): string {
        return JSON.stringify(value)
                .replace(/</g, '\\u003c')
                .replace(/>/g, '\\u003e')
                .replace(/&/g, '\\u0026')
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
}
