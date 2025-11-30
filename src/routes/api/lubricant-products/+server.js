import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { lubricantProducts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
	try {
		const products = await db.select().from(lubricantProducts).all();
		return json({ success: true, products });
	} catch (error) {
		return json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { products } = await request.json();
		
		if (!products || !Array.isArray(products)) {
			return json({ success: false, error: 'Invalid products data' }, { status: 400 });
		}

		// Clear existing products
		await db.delete(lubricantProducts).run();

		// Insert new products
		for (const product of products) {
			if (product.name && product.price) {
				await db.insert(lubricantProducts).values({
					name: product.name,
					price: parseFloat(product.price)
				}).run();
			}
		}

		return json({ success: true, message: 'Products uploaded successfully' });
	} catch (error) {
		return json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
	try {
		const { id } = await request.json();
		await db.delete(lubricantProducts).where(eq(lubricantProducts.id, id)).run();
		return json({ success: true });
	} catch (error) {
		return json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}
