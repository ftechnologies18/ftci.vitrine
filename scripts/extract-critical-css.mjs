/**
 * extract-critical-css.mjs — Post-build script to inline critical CSS.
 *
 * Principe : extraire le CSS nécessaire au rendu above-the-fold (header + hero
 * slide 1) et l'inline dans une balise <style> dans le <head>. Le reste du CSS
 * reste chargé de manière asynchrone (preload + onload swap via make-css-async.mjs).
 *
 * Bénéfice : le navigateur n'a plus à attendre la requête réseau + le parsing
 * du fichier CSS externe pour peindre le rendu initial. Le FCP (First Contentful
 * Paint) s'améliore de 200-400ms typiquement.
 *
 * Algorithme :
 *   1. Lire le HTML, identifier le périmètre above-the-fold (header → section#solutions)
 *   2. Collecter toutes les classes, IDs, data-astro-cid du périmètre
 *   3. Parser le CSS :
 *      - Garder tous les @font-face (nécessaires pour les polices)
 *      - Garder :root et @theme (tokens Tailwind 4)
 *      - Garder les règles dont le sélecteur match une classe/ID/CID above-the-fold
 *      - Garder les @keyframes référencés par animation-name dans les règles retenues
 *   4. Inliner le critical CSS dans <head> avant tout autre <link> CSS
 *   5. Le CSS externe reste intact (chargé en async par make-css-async.mjs)
 *
 * Usage: node scripts/extract-critical-css.mjs
 * Run after: npx astro build (processes dist/client/*.html)
 * Run before: make-css-async.mjs (pour que ce dernier transforme aussi le CSS externe)
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST_DIR = 'dist/client';

async function findHtmlFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findHtmlFiles(fullPath)));
		} else if (extname(entry.name) === '.html') {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Identifie le périmètre above-the-fold dans le HTML.
 * Inclut :
 *   - la balise <body> (ses classes définissent le fond global, la couleur de texte)
 *   - du <header> jusqu'à la section #solutions (première section "below the fold")
 *
 * Le <body> est crucial : ses classes (bg-light-bg, text-navy, antialiased...)
 * appliquent le fond et la couleur par défaut de toute la page.
 */
function extractAboveFoldHtml(html) {
	const bodyMatch = html.match(/<body[^>]*>/);
	const headerMatch = html.match(/<header[^>]*>/);
	const solutionsMatch = html.match(/<section[^>]*id="solutions"/);

	let start = bodyMatch ? bodyMatch.index : headerMatch ? headerMatch.index : 0;
	let end = solutionsMatch
		? solutionsMatch.index
		: bodyMatch
			? bodyMatch.index + 14000
			: html.length;

	if (headerMatch && solutionsMatch) {
		// Inclure body + header + hero (jusqu'à #solutions)
		return html.slice(start, end);
	}

	// Fallback : premiers 14KB depuis le body
	return html.slice(start, Math.min(end, start + 14000));
}

/**
 * Collecte tous les identifiants CSS du périmètre : classes, IDs, data-astro-cid.
 */
function collectIdentifiers(html) {
	const classes = new Set();
	const ids = new Set();
	const cids = new Set();

	// Classes (gère les class avec plusieurs valeurs)
	for (const m of html.matchAll(/class="([^"]+)"/g)) {
		for (const c of m[1].split(/\s+/)) {
			if (c) classes.add(c);
		}
	}
	// IDs
	for (const m of html.matchAll(/id="([^"]+)"/g)) {
		ids.add(m[1]);
	}
	// data-astro-cid-xxx (composants scoped Astro)
	for (const m of html.matchAll(/data-astro-cid-([a-z0-9]+)/g)) {
		cids.add(m[1]);
	}

	return { classes, ids, cids };
}

/**
 * Parse le CSS et extrait les règles critiques.
 * Retourne le critical CSS (string).
 *
 * Algorithme :
 *   - @font-face : tous (nécessaires pour les polices)
 *   - @theme inline / :root : tous (tokens Tailwind 4 + variables CSS)
 *   - @keyframes : filtrés (seulement ceux référencés par les animations retenues)
 *   - règles normales : si le sélecteur match le périmètre above-the-fold
 *   - @media : on ne garde que les règles internes qui matchent (filtrage récursif)
 */
function extractCriticalCss(css, { classes, ids, cids }) {
	// 1. @font-face (tous)
	const fontFaces = [];
	const fontFaceRe = /@font-face\s*\{/g;
	let m;
	while ((m = fontFaceRe.exec(css)) !== null) {
		const block = extractBalancedBlock(css, m.index + m[0].length - 1);
		if (block) fontFaces.push(`@font-face{${block}}`);
	}

	// 2. @theme inline + :root (tous — tokens essentiels).
	// Tailwind 4 génère :root et :root,:host DANS @layer theme. On doit donc
	// aussi scanner le contenu des @layer pour trouver ces blocks.
	const themeBlocks = [];
	const themeRe = /(@theme\s+inline)\s*\{/g;
	while ((m = themeRe.exec(css)) !== null) {
		const block = extractBalancedBlock(css, m.index + m[0].length - 1);
		if (block) themeBlocks.push('@theme inline{' + block + '}');
	}
	const rootBlocks = [];
	// Matche :root seul OU combiné (:root,:host). On scanne tout le CSS
	// (top-level ET à l'intérieur des @layer) en cherchant les sélecteurs :root.
	const rootRe = /(^|[;}{])([^{};]*?:root[^{};]*)\{/g;
	while ((m = rootRe.exec(css)) !== null) {
		const selector = m[2].trim();
		if (selector.includes(':root') && !selector.startsWith('@')) {
			const block = extractBalancedBlock(css, m.index + m[0].length - 1);
			if (block) {
				const fullRule = selector + '{' + block + '}';
				// Éviter les doublons
				if (!rootBlocks.includes(fullRule)) {
					rootBlocks.push(fullRule);
				}
			}
		}
	}

	// 3. @keyframes (collectés, filtrés plus tard)
	const keyframesByName = new Map();
	const kfRe = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g;
	while ((m = kfRe.exec(css)) !== null) {
		const name = m[1];
		const block = extractBalancedBlock(css, m.index + m[0].length - 1);
		if (block) keyframesByName.set(name, `@keyframes ${name}{${block}}`);
	}

	// 4. Parser le CSS en "règles top-level" (en respectant les imbrications)
	const topRules = parseTopLevelRules(css);

	// 5. Pour chaque règle top-level, déterminer si elle est critique.
	// On doit descendre dans les @layer (Tailwind 4 met tout dedans) et les @media.
	const criticalRules = [];
	const usedKeyframes = new Set();

	/**
	 * Traite une liste de règles : pour chacune, si c'est un @layer ou @media,
	 * on descend récursivement dans son body. Sinon, on vérifie le sélecteur.
	 */
	function processRules(rules) {
		for (const rule of rules) {
			const { selector, body, full } = rule;

			// @layer : descendre dedans (Tailwind 4 structure)
			if (selector.startsWith('@layer')) {
				const innerRules = parseTopLevelRules(body);
				processRules(innerRules);
				continue;
			}

			// @media : filtrer le contenu récursivement, ne garder que les règles qui matchent
			if (selector.startsWith('@media')) {
				const innerRules = parseTopLevelRules(body);
				const matchedInner = [];
				const innerUsed = new Set();
				for (const inner of innerRules) {
					if (inner.selector.startsWith('@layer')) {
						// @media > @layer : descendre encore
						const layerInner = parseTopLevelRules(inner.body);
						for (const li of layerInner) {
							if (selectorMatches(li.selector, { classes, ids, cids })) {
								matchedInner.push(li.full);
								collectAnimationNames(li.full, keyframesByName, innerUsed);
							}
						}
					} else if (selectorMatches(inner.selector, { classes, ids, cids })) {
						matchedInner.push(inner.full);
						collectAnimationNames(inner.full, keyframesByName, innerUsed);
					}
				}
				if (matchedInner.length > 0) {
					criticalRules.push(`${selector}{${matchedInner.join('')}}`);
					for (const k of innerUsed) usedKeyframes.add(k);
				}
				continue;
			}

			// @font-face, @keyframes, @theme — déjà extraits séparément
			if (
				selector.startsWith('@font-face') ||
				selector.startsWith('@keyframes') ||
				selector.startsWith('@theme') ||
				selector.startsWith('@supports')
			) {
				continue;
			}

			// :root et :root,:host — déjà extraits, mais on les prend quand même si match
			if (selector.includes(':root')) {
				// déjà dans rootBlocks, skip
				continue;
			}

			// Règle normale : vérifier le sélecteur
			if (selectorMatches(selector, { classes, ids, cids })) {
				criticalRules.push(full);
				collectAnimationNames(full, keyframesByName, usedKeyframes);
			}
		}
	}

	processRules(topRules);

	// 6. Assembler
	const parts = [
		...fontFaces,
		...themeBlocks,
		...rootBlocks,
		...criticalRules,
		...[...usedKeyframes].map((name) => keyframesByName.get(name)),
	];

	return parts.filter(Boolean).join('\n');
}

/**
 * Parse le CSS en règles top-level, en respectant les accolades imbriquées.
 * Retourne un tableau de { selector, body, full }.
 * Pour les @media, body = contenu entre { }, et le parser récursif peut l'analyser.
 */
function parseTopLevelRules(css) {
	const rules = [];
	let i = 0;
	let selectorStart = 0;
	let depth = 0;

	while (i < css.length) {
		const ch = css[i];
		if (ch === '{') {
			if (depth === 0) {
				const selector = css.slice(selectorStart, i).trim();
				// Trouver la fin du bloc (accolade correspondante)
				let j = i + 1;
				let d = 1;
				while (j < css.length && d > 0) {
					if (css[j] === '{') d++;
					else if (css[j] === '}') d--;
					j++;
				}
				const body = css.slice(i + 1, j - 1);
				const full = css.slice(selectorStart, j);
				rules.push({ selector, body, full });
				i = j;
				selectorStart = j;
				depth = 0;
				continue;
			}
			depth++;
		}
		i++;
	}
	return rules;
}

/**
 * Extrait les noms d'animations référencés dans une règle CSS
 * et ajoute les @keyframes correspondants à l'ensemble usedKeyframes.
 */
function collectAnimationNames(ruleText, keyframesByName, usedKeyframes) {
	const animMatch = ruleText.match(/animation(?:-name)?\s*:\s*([^;}]+)/g);
	if (animMatch) {
		for (const a of animMatch) {
			const names = a
				.split(':')[1]
				.split(/[;}\s,]+/)
				.filter(Boolean);
			for (const n of names) {
				if (keyframesByName.has(n)) {
					usedKeyframes.add(n);
				}
			}
		}
	}
}

/**
 * Extrait le contenu d'un bloc { ... } équilibré à partir de l'indice de l'accolade ouvrante.
 * Retourne le contenu SANS les accolades externes.
 */
function extractBalancedBlock(css, openBraceIndex) {
	let depth = 1;
	let i = openBraceIndex + 1;
	while (i < css.length && depth > 0) {
		if (css[i] === '{') depth++;
		else if (css[i] === '}') depth--;
		if (depth === 0) {
			return css.slice(openBraceIndex + 1, i);
		}
		i++;
	}
	return null;
}

/**
 * Vérifie si un sélecteur CSS correspond au périmètre above-the-fold.
 */
function selectorMatches(selector, { classes, ids, cids }) {
	if (!selector) return false;

	// Sélecteurs globaux toujours critiques
	const globalPatterns = [
		/^\*/, // *
		/^html\b/, // html
		/^body\b/, // body
		/^:root\b/, // :root
		/^\[hidden\]/,
		/^\[tabindex/,
		/^::view/,
		/^:focus-visible\b/,
		/^@supports/, // @supports (affecte le rendu)
		/^@media/, // @media (traité séparément mais inclus)
	];
	for (const p of globalPatterns) {
		if (p.test(selector)) return true;
	}

	// @font-face, @keyframes, @theme — gérés séparément
	if (
		selector.startsWith('@font-face') ||
		selector.startsWith('@keyframes') ||
		selector.startsWith('@theme')
	) {
		return false; // déjà extraits
	}

	// Vérifier les classes
	for (const cls of classes) {
		// Échapper les caractères spéciaux CSS dans le nom de classe
		const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		// \\.cls\\b ou \\.cls[^a-zA-Z0-9_-]
		const re = new RegExp(`\\.${escaped}(?=[^a-zA-Z0-9_-]|$)`);
		if (re.test(selector)) return true;
	}

	// Vérifier les IDs
	for (const id of ids) {
		const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const re = new RegExp(`#${escaped}(?=[^a-zA-Z0-9_-]|$)`);
		if (re.test(selector)) return true;
	}

	// Vérifier les data-astro-cid (styles scoped des composants)
	for (const cid of cids) {
		if (selector.includes(`data-astro-cid-${cid}`)) return true;
	}

	// Sélecteurs d'attributs globaux communs (sr-only, container, etc.)
	const utilityPatterns = [
		/\.sr-only\b/,
		/\.container\b/,
		/\.observe\b/,
		/\.is-visible\b/,
		/\[data-magnetic\]/,
		/\[data-parallax\]/,
	];
	for (const p of utilityPatterns) {
		if (p.test(selector)) return true;
	}

	return false;
}

/**
 * Iniline le critical CSS dans le <head> du HTML.
 * L'insère juste après <meta charset> et <meta viewport> pour qu'il soit
 * disponible le plus tôt possible.
 */
function inlineCriticalCss(html, criticalCss) {
	// Point d'insertion : après la balise <meta name="viewport">
	const viewportMatch = html.match(/<meta\s+name="viewport"[^>]*>/);
	if (!viewportMatch) {
		console.warn('  ⚠️  <meta viewport> non trouvé, insertion après <head>');
		return html.replace(
			/<head>/,
			'<head>\n<style id="critical-css">\n' + criticalCss + '\n</style>',
		);
	}

	const insertPos = viewportMatch.index + viewportMatch[0].length;
	const styleTag = `\n<style id="critical-css">\n${criticalCss}\n</style>`;
	return html.slice(0, insertPos) + styleTag + html.slice(insertPos);
}

async function main() {
	console.log('🎨 extract-critical-css: Processing HTML files in', DIST_DIR);

	const htmlFiles = await findHtmlFiles(DIST_DIR);
	console.log(`📄 Found ${htmlFiles.length} HTML files`);

	// Trouver le fichier CSS unique (cssCodeSplit: false)
	const cssFiles = await readdir(join(DIST_DIR, '_astro'));
	const cssFile = cssFiles.find((f) => f.endsWith('.css'));
	if (!cssFile) {
		console.warn('  ⚠️  Aucun fichier CSS trouvé dans _astro/, skip.');
		return;
	}
	const cssPath = join(DIST_DIR, '_astro', cssFile);
	const css = await readFile(cssPath, 'utf-8');
	console.log(`📦 CSS source: ${cssFile} (${(css.length / 1024).toFixed(1)} KB)`);

	let totalInlined = 0;

	for (const file of htmlFiles) {
		let html = await readFile(file, 'utf-8');

		// Ignorer les pages de redirection Astro (meta http-equiv="refresh")
		// Elles n'ont pas de contenu à peindre ni de CSS à inliner.
		if (html.includes('<meta http-equiv="refresh"')) {
			const rel = file.replace(DIST_DIR + '/', '');
			console.log(`  ⏭️  ${rel} — page de redirection, skip`);
			continue;
		}

		// 1. Périmètre above-the-fold
		const aboveFold = extractAboveFoldHtml(html);
		if (!aboveFold) {
			console.warn(`  ⚠️  ${file}: périmètre above-the-fold non trouvé, skip`);
			continue;
		}

		// 2. Collecter les identifiants
		const identifiers = collectIdentifiers(aboveFold);

		// 3. Extraire le critical CSS
		const criticalCss = extractCriticalCss(css, identifiers);
		const criticalSize = Buffer.byteLength(criticalCss, 'utf-8');

		// 4. Inliner
		html = inlineCriticalCss(html, criticalCss);
		await writeFile(file, html, 'utf-8');

		const rel = file.replace(DIST_DIR + '/', '');
		console.log(
			`  ✅ ${rel} — critical CSS: ${(criticalSize / 1024).toFixed(1)} KB ` +
				`(classes: ${identifiers.classes.size}, ids: ${identifiers.ids.size}, cids: ${identifiers.cids.size})`,
		);
		totalInlined += criticalSize;
	}

	console.log(
		`\n🎉 Done! Total critical CSS inlined: ${(totalInlined / 1024).toFixed(1)} KB across ${htmlFiles.length} HTML files.`,
	);
	console.log(
		`   Le CSS externe reste chargé en async via make-css-async.mjs (à exécuter ensuite).`,
	);
}

main().catch((err) => {
	console.error('❌ extract-critical-css failed:', err);
	process.exit(1);
});
