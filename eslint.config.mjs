// @ts-check
/**
 * ESLint flat config — FTCI Vitrine
 *
 * Configuration moderne (ESLint 9+, flat config) combinant :
 *   - @eslint/js : règles recommandées JavaScript
 *   - typescript-eslint : règles TypeScript strictes
 *   - eslint-plugin-astro : règles spécifiques Astro
 *   - eslint-config-prettier : désactive les règles qui conflictent avec Prettier
 *
 * Références :
 *   - https://eslint.org/docs/latest/use/configure/configuration-files
 *   - https://typescript-eslint.io/getting-started
 *   - https://ota-meshi.github.io/eslint-plugin-astro/
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
	// Fichiers globaux ignorés
	{
		ignores: [
			'dist/',
			'.astro/',
			'node_modules/',
			'patches/',
			'public/',
			'scripts/gen-favicon.mjs',
			'worker-configuration.d.ts',
			'*.config.{js,mjs,ts}',
			'src/env.d.ts',
		],
	},

	// Base JavaScript recommandé
	js.configs.recommended,

	// TypeScript strict (type-aware sur les fichiers .ts)
	...tseslint.configs.recommended,

	// Astro : règles spécifiques aux composants .astro
	...astro.configs.recommended,

	// Désactive les règles qui conflictent avec Prettier (en dernier)
	prettierConfig,

	// Overrides spécifiques au projet
	{
		files: ['**/*.{ts,tsx,astro}'],
		rules: {
			// Conventions FTCI
			'no-console': ['warn', { allow: ['warn', 'error'] }], // console.log → warn, console.error OK
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			// Permettre les any explicites (parfois nécessaire avec les types Cloudflare)
			'@typescript-eslint/no-explicit-any': 'warn',
			// Pas de require() en ES modules
			'no-undef': 'off', // TypeScript s'en charge
		},
	},

	// Scripts de build (Node.js, pas Astro)
	{
		files: ['scripts/**/*.{mjs,js}'],
		rules: {
			'no-console': 'off',
		},
	},

	// API endpoints : console.log autorisé (debug via wrangler tail)
	{
		files: ['src/pages/api/**/*.{ts,js}'],
		rules: {
			'no-console': 'off',
		},
	},
);
