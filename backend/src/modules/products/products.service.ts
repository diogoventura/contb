import prisma from '../../config/database';

export class ProductsService {
    async getAll(page: number = 1, limit: number = 20, search?: string) {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search } },
                { description: { contains: search } },
                { sku: { contains: search } }
            ]
        } : {};

        const [products, total] = await Promise.all([
            prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            prisma.product.count({ where })
        ]);
        return { products, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getById(id: number) {
        return prisma.product.findUnique({ where: { id } });
    }

    async create(userId: number, data: { name: string; description?: string; sku?: string; unitPrice: number; costPrice?: number; quantity: number; minStock?: number }) {
        return prisma.product.create({
            data: {
                name: data.name,
                description: data.description || '',
                sku: data.sku || '',
                unitPrice: Number(data.unitPrice) || 0,
                costPrice: Number(data.costPrice) || 0,
                quantity: Number(data.quantity) || 0,
                minStock: Number(data.minStock) || 0,
                user: { connect: { id: userId } }
            }
        });
    }

    async update(id: number, data: any) {
        const updateData = { ...data };
        // Map frontend names to schema names if they differ
        if (updateData.unitPrice !== undefined) updateData.unitPrice = Number(updateData.unitPrice);
        if (updateData.costPrice !== undefined) updateData.costPrice = Number(updateData.costPrice);
        if (updateData.quantity !== undefined) updateData.quantity = Number(updateData.quantity);
        if (updateData.minStock !== undefined) updateData.minStock = Number(updateData.minStock);

        return prisma.product.update({ where: { id }, data: updateData });
    }

    async delete(id: number) {
        return prisma.product.delete({ where: { id } });
    }
}

export const productsService = new ProductsService();
