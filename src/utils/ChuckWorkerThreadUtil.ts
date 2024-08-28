export async function checkify<T>(data: T[], n: number): Promise<T[][]> {
    const chunks: T[][] = [];
    for(let i = n; i > 0; i--) {
        chunks.push(data.splice(0, Math.ceil(data.length / i)));
    }
    return chunks;
}
