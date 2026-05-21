
export async function fetchHotels() {
    const response = await fetch('https://dummyjson.com/products?limit=10');
    const data = await response.json();
    return data.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        thumbnail: product.thumbnail, // Ajuste se o campo for diferente
        // Adicione outros campos se necessário
    }));
}