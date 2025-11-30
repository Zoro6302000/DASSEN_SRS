
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/daily-sales" | "/api/lubricant-products" | "/daily sales" | "/daily-sales" | "/lubricant-products" | "/shadcn-demo";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/api": Record<string, never>;
			"/api/daily-sales": Record<string, never>;
			"/api/lubricant-products": Record<string, never>;
			"/daily sales": Record<string, never>;
			"/daily-sales": Record<string, never>;
			"/lubricant-products": Record<string, never>;
			"/shadcn-demo": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/daily-sales" | "/api/daily-sales/" | "/api/lubricant-products" | "/api/lubricant-products/" | "/daily sales" | "/daily sales/" | "/daily-sales" | "/daily-sales/" | "/lubricant-products" | "/lubricant-products/" | "/shadcn-demo" | "/shadcn-demo/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.svg" | "/robots.txt" | string & {};
	}
}