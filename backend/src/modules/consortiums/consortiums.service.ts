import prisma from '../../config/database';

export class ConsortiumsService {
    async getAll(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const [consortiums, total] = await Promise.all([
            prisma.consortium.findMany({
                skip, take: limit,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { participants: true } } }
            }),
            prisma.consortium.count()
        ]);
        return { consortiums, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getById(id: number) {
        return prisma.consortium.findUnique({
            where: { id },
            include: { participants: { orderBy: { slotNumber: 'asc' } } }
        });
    }

    async create(userId: number, data: { name: string; description?: string; totalValue: number; monthlyValue: number; totalSlots: number; startDate?: string; endDate?: string; reminderDaysBefore?: number; reminderIntervalAfter?: number }) {
        return (prisma.consortium.create as any)({
            data: {
                name: data.name,
                description: data.description || '',
                totalValue: Number(data.totalValue),
                monthlyValue: Number(data.monthlyValue),
                totalSlots: Number(data.totalSlots),
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                reminderDaysBefore: data.reminderDaysBefore ? Number(data.reminderDaysBefore) : null,
                reminderIntervalAfter: data.reminderIntervalAfter ? Number(data.reminderIntervalAfter) : null,
                user: { connect: { id: userId } }
            }
        });
    }

    async update(id: number, data: any) {
        const consortium = await prisma.consortium.findUnique({
            where: { id },
            include: { _count: { select: { participants: true } } }
        });

        if (!consortium) throw new Error('Consórcio não encontrado');

        if (data.totalSlots && data.totalSlots < consortium._count.participants) {
            throw new Error(`Não é possível reduzir as vagas para ${data.totalSlots} pois já existem ${consortium._count.participants} participantes cadastrados.`);
        }

        const updateData: any = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        if (data.totalValue) updateData.totalValue = Number(data.totalValue);
        if (data.monthlyValue) updateData.monthlyValue = Number(data.monthlyValue);
        if (data.totalSlots) updateData.totalSlots = Number(data.totalSlots);
        if (data.reminderDaysBefore !== undefined) updateData.reminderDaysBefore = data.reminderDaysBefore ? Number(data.reminderDaysBefore) : null;
        if (data.reminderIntervalAfter !== undefined) updateData.reminderIntervalAfter = data.reminderIntervalAfter ? Number(data.reminderIntervalAfter) : null;

        return (prisma.consortium.update as any)({ where: { id }, data: updateData });
    }

    async delete(id: number) { return prisma.consortium.delete({ where: { id } }); }

    async addParticipant(consortiumId: number, data: { name: string; phone?: string; email?: string; document?: string }) {
        const consortium = await prisma.consortium.findUnique({
            where: { id: consortiumId },
            include: { _count: { select: { participants: true } } }
        });

        if (!consortium) throw new Error('Consórcio não encontrado');

        if (consortium._count.participants >= consortium.totalSlots) {
            throw new Error('Este consórcio já atingiu o limite máximo de participantes.');
        }

        const lastParticipant = await prisma.consortiumParticipant.findFirst({
            where: { consortiumId },
            orderBy: { slotNumber: 'desc' },
            select: { slotNumber: true }
        });

        const nextSlot = (lastParticipant?.slotNumber || 0) + 1;

        return prisma.consortiumParticipant.create({
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                document: data.document,
                slotNumber: nextSlot,
                consortium: { connect: { id: consortiumId } }
            }
        });
    }

    async updateParticipant(id: number, data: any) {
        return prisma.consortiumParticipant.update({ where: { id }, data });
    }

    async removeParticipant(id: number) {
        return prisma.consortiumParticipant.delete({ where: { id } });
    }

    async getParticipants(consortiumId: number) {
        return prisma.consortiumParticipant.findMany({
            where: { consortiumId },
            orderBy: { slotNumber: 'asc' }
        });
    }

    async getParticipantDetails(participantId: number) {
        const participant = await prisma.consortiumParticipant.findUnique({
            where: { id: participantId },
            include: { consortium: true }
        });

        if (!participant) throw new Error('Participante não encontrado');

        // Find sales linked by phone, email, or (Name + Consortium)
        const orConditions: any[] = [];
        if (participant.phone) {
            const digits = participant.phone.replace(/\D/g, '');
            orConditions.push({ personPhone: participant.phone });
            if (digits && digits.length >= 8) {
                orConditions.push({ personPhone: { contains: digits.slice(-9) } });
            }
        }
        if (participant.email && participant.email !== 'null') {
            orConditions.push({ personEmail: participant.email });
        }

        // Fallback: Name + Consortium match
        orConditions.push({
            AND: [
                { personName: participant.name },
                { consortiumId: participant.consortiumId }
            ]
        });

        let sales: any[] = [];
        if (orConditions.length > 0) {
            sales = await prisma.sale.findMany({
                where: { OR: orConditions },
                orderBy: { soldAt: 'desc' },
                include: {
                    saleItems: { include: { product: { select: { name: true } } } },
                    installments: { orderBy: { number: 'asc' } }
                }
            });
        }

        // Compute financial summary
        let totalPurchased = 0;
        let totalPaid = 0;
        let totalPending = 0;

        for (const sale of sales) {
            totalPurchased += Number(sale.totalAmount);
            for (const inst of sale.installments) {
                if (inst.status === 'paid') {
                    totalPaid += Number(inst.amount);
                } else {
                    totalPending += Number(inst.amount);
                }
            }
        }

        return {
            participant,
            consortium: participant.consortium,
            sales,
            summary: { totalPurchased, totalPaid, totalPending }
        };
    }
}

export const consortiumsService = new ConsortiumsService();
