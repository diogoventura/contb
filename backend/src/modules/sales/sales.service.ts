import prisma from '../../config/database';
import { addMonths } from 'date-fns';
import { whatsappService } from '../whatsapp/whatsapp.service';

export class SalesService {
    async bulkNotify(installmentIds: number[]) {
        const results = [];
        const installments = await prisma.installment.findMany({
            where: { id: { in: installmentIds } },
            include: { sale: true }
        });

        for (const inst of installments) {
            if (!inst.sale.personPhone) {
                results.push({ id: inst.id, success: false, error: 'Sem telefone' });
                continue;
            }

            const message = `📋 *Lembrete de Pagamento*\n\nOlá ${inst.sale.personName},\n\nPassando para lembrar que sua parcela nº ${inst.number} no valor de R$${Number(inst.amount).toFixed(2)} está ${inst.status === 'overdue' ? '*atrasada*' : 'pendente'} (Vencimento: ${inst.dueDate.toLocaleDateString('pt-BR')}).\n\nCaso já tenha realizado o pagamento, desconsidere esta mensagem.\n\nObrigado! 🙏`;

            try {
                await whatsappService.sendMessage(inst.sale.personPhone, message);
                results.push({ id: inst.id, success: true });
            } catch (error) {
                results.push({ id: inst.id, success: false, error: (error as Error).message });
            }
        }
        return results;
    }

    async getByPerson(phone?: string, email?: string) {
        if (!phone && !email) return [];
        const conditions: any[] = [];

        if (email) {
            conditions.push({ personEmail: email });
        }

        if (phone) {
            conditions.push({ personPhone: phone });
            // Adiciona busca por apenas números para ser mais flexível
            const digits = phone.replace(/\D/g, '');
            if (digits && digits !== phone) {
                conditions.push({ personPhone: digits });
            }
            // Adiciona busca parcial se o telefone for longo (ex: busca pelos últimos 9 dígitos)
            if (digits.length >= 8) {
                conditions.push({ personPhone: { contains: digits.slice(-9) } });
            }
        }

        return prisma.sale.findMany({
            where: {
                OR: conditions
            },
            include: {
                installments: { orderBy: { number: 'asc' } },
                saleItems: { include: { product: true } }
            },
            orderBy: { soldAt: 'desc' }
        });
    }

    async getAll(page: number = 1, limit: number = 20, status?: string) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where, skip, take: limit,
                orderBy: { soldAt: 'desc' },
                include: { saleItems: { include: { product: true } }, installments: true }
            }),
            prisma.sale.count({ where })
        ]);
        return { sales, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getById(id: number) {
        return prisma.sale.findUnique({
            where: { id },
            include: { saleItems: { include: { product: true } }, installments: { orderBy: { number: 'asc' } } }
        });
    }

    async create(userId: number, data: { personName: string; personPhone?: string; personEmail?: string; personDocument?: string; totalAmount: number; soldAt?: string; items: any[]; installmentCount?: number; notes?: string; consortiumId?: number; reminderDaysBefore?: number; reminderIntervalAfter?: number }) {
        const { items, installmentCount = 1, ...saleData } = data;
        const soldAt = saleData.soldAt ? new Date(saleData.soldAt) : new Date();

        return prisma.$transaction(async (tx) => {
            const sale = await (tx.sale.create as any)({
                data: {
                    personName: saleData.personName,
                    personPhone: saleData.personPhone,
                    personEmail: saleData.personEmail,
                    personDocument: saleData.personDocument,
                    totalAmount: Number(saleData.totalAmount),
                    installmentCount: Number(installmentCount),
                    notes: saleData.notes,
                    soldAt,
                    consortiumId: saleData.consortiumId ? Number(saleData.consortiumId) : null,
                    reminderDaysBefore: saleData.reminderDaysBefore ? Number(saleData.reminderDaysBefore) : null,
                    reminderIntervalAfter: saleData.reminderIntervalAfter ? Number(saleData.reminderIntervalAfter) : null,
                    user: { connect: { id: userId } },
                    saleItems: {
                        create: items.map((i: any) => ({
                            productId: Number(i.productId),
                            quantity: Number(i.quantity),
                            unitPrice: Number(i.unitPrice),
                            subtotal: Number(i.unitPrice) * Number(i.quantity)
                        }))
                    }
                }
            });

            // Generate installments
            const amountPerInstallment = Number(sale.totalAmount) / Number(installmentCount);
            for (let i = 1; i <= installmentCount; i++) {
                await tx.installment.create({
                    data: {
                        saleId: sale.id,
                        number: i,
                        amount: amountPerInstallment,
                        dueDate: addMonths(soldAt, i),
                        status: 'pending'
                    }
                });
            }

            // Update product quantities
            for (const item of items) {
                await tx.product.update({
                    where: { id: Number(item.productId) },
                    data: { quantity: { decrement: Number(item.quantity) } }
                });
            }

            return tx.sale.findUnique({
                where: { id: sale.id },
                include: { saleItems: true, installments: true }
            });
        });
    }

    async update(id: number, data: any) {
        const updateData = { ...data };
        if (data.consortiumId !== undefined) updateData.consortiumId = data.consortiumId ? Number(data.consortiumId) : null;
        if (data.reminderDaysBefore !== undefined) updateData.reminderDaysBefore = data.reminderDaysBefore ? Number(data.reminderDaysBefore) : null;
        if (data.reminderIntervalAfter !== undefined) updateData.reminderIntervalAfter = data.reminderIntervalAfter ? Number(data.reminderIntervalAfter) : null;

        return (prisma.sale.update as any)({ where: { id }, data: updateData });
    }

    async delete(id: number) {
        return prisma.sale.delete({ where: { id } });
    }

    async payInstallment(id: number) {
        return prisma.installment.update({
            where: { id },
            data: { status: 'paid', paidAt: new Date() }
        });
    }

    async generateBoleto(installmentId: number) {
        const inst = await prisma.installment.findUnique({ where: { id: installmentId }, include: { sale: true } });
        if (!inst) throw new Error('Installment not found');

        // Em um sistema real, aqui chamaríamos uma API de boletos (Iugu, GalaxPay, etc)
        // Por enquanto, geramos nosso próprio boleto HTML inspirado no modelo Itaú/GMAC
        const boletoUrl = `/api/sales/boleto-view/${installmentId}`;

        await prisma.installment.update({
            where: { id: installmentId },
            data: { boletoUrl }
        });

        return {
            boletoUrl,
            barCode: '34191.98084 11190.000007 27103.042308 9 70410000038383',
            installmentId
        };
    }

    async renderBoletoHTML(installmentId: number) {
        const inst = await prisma.installment.findUnique({
            where: { id: installmentId },
            include: { sale: { include: { user: true } } }
        });
        if (!inst) throw new Error('Boleto não encontrado');

        const sale = inst.sale;
        const dueDate = new Date(inst.dueDate).toLocaleDateString('pt-BR');
        const docDate = new Date(sale.soldAt).toLocaleDateString('pt-BR');
        const amount = Number(inst.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        // Template HTML inspirado no Itaú/GMAC
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Boleto Bancário - ContB</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #000; font-size: 11px; }
                .boleto-container { width: 700px; margin: 0 auto; border: 1px solid #000; padding: 10px; background: #fff; }
                .header-row { display: flex; border-bottom: 2px solid #000; padding-bottom: 5px; align-items: flex-end; }
                .bank-logo { font-size: 24px; font-weight: bold; border-right: 2px solid #000; padding-right: 15px; margin-right: 15px; }
                .bank-code { font-size: 18px; font-weight: bold; border-right: 2px solid #000; padding-right: 15px; margin-right: 15px; }
                .digitable-line { font-size: 14px; font-weight: bold; flex-grow: 1; text-align: right; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 0; }
                td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
                .label { font-size: 8px; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px; }
                .value { font-size: 11px; font-weight: bold; }
                
                .col-vencimento { width: 180px; background: #f0f0f0; }
                .col-valor { width: 180px; background: #f0f0f0; }
                
                .instructions { min-height: 150px; }
                .footer-info { margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
                
                .barcode-area { margin-top: 20px; display: flex; flex-direction: column; align-items: flex-start; }
                .barcode-mock { height: 50px; background: #000; width: 400px; margin-bottom: 5px; }
                
                @media print {
                    .no-print { display: none; }
                    body { margin: 0; }
                    .boleto-container { border: none; }
                }
                
                .btn-print { margin-bottom: 20px; padding: 10px 20px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align: center;">
                <button class="btn-print" onclick="window.print()">Imprimir Boleto</button>
            </div>
            
            <div class="boleto-container">
                <div class="header-row">
                    <div class="bank-logo">ContB</div>
                    <div class="bank-code">341-7</div>
                    <div class="digitable-line">34191.98084 11190.000007 27103.042308 9 70410000038383</div>
                </div>
                
                <table>
                    <tr>
                        <td colspan="4">
                            <span class="label">Local de Pagamento</span>
                            <span class="value">QUALQUER BANCO ATÉ O VENCIMENTO</span>
                        </td>
                        <td class="col-vencimento">
                            <span class="label">Vencimento</span>
                            <span class="value">${dueDate}</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4">
                            <span class="label">Beneficiário</span>
                            <span class="value">CONTB SERVICOS FINANCEIROS LTDA - CNPJ: 12.345.678/0001-90</span><br>
                            <span class="value">AV. PAULISTA, 1000 - BELA VISTA - CEP: 01310-100 SAO PAULO-SP</span>
                        </td>
                        <td>
                            <span class="label">Agência / Código Beneficiário</span>
                            <span class="value">2938 / 03042-2</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="label">Data do Documento</span>
                            <span class="value">${docDate}</span>
                        </td>
                        <td>
                            <span class="label">Nº do Documento</span>
                            <span class="value">${sale.id}-${inst.number}</span>
                        </td>
                        <td>
                            <span class="label">Espécie Doc.</span>
                            <span class="value">REC</span>
                        </td>
                        <td>
                            <span class="label">Aceite</span>
                            <span class="value">N</span>
                        </td>
                        <td>
                            <span class="label">Data Processamento</span>
                            <span class="value">${new Date().toLocaleDateString('pt-BR')}</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="label">Uso do Banco</span>
                            <span class="value"></span>
                        </td>
                        <td>
                            <span class="label">Carteira</span>
                            <span class="value">109</span>
                        </td>
                        <td>
                            <span class="label">Moeda</span>
                            <span class="value">R$</span>
                        </td>
                        <td>
                            <span class="label">Quantidade</span>
                            <span class="value"></span>
                        </td>
                        <td class="col-valor">
                            <span class="label">(=) Valor do Documento</span>
                            <span class="value">R$ ${amount}</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" class="instructions">
                            <span class="label">Instruções (Texto de Responsabilidade do Beneficiário)</span>
                            <span class="value">
                                REFERENTE À PARCELA ${inst.number} DE ${sale.installmentCount}<br>
                                VENDA REALIZADA EM ${docDate}<br><br>
                                APÓS O VENCIMENTO COBRAR MULTA DE 2% E JUROS DE 1% AO MÊS.<br>
                                NÃO RECEBER APÓS 30 DIAS DE ATRASO.
                            </span>
                        </td>
                        <td>
                            <span class="label">(-) Descontos / Abatimentos</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" rowspan="4" style="border-top: none;">
                            <span class="label">Pagador</span>
                            <span class="value" style="font-size: 13px;">${sale.personName.toUpperCase()}</span><br>
                            <span class="value">${sale.personPhone || ''}</span><br>
                            <span class="value">${sale.personEmail || ''}</span>
                        </td>
                        <td>
                            <span class="label">(-) Outras Deduções</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="label">(+) Mora / Multa</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="label">(+) Outros Acréscimos</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f0f0f0;">
                            <span class="label">(=) Valor Cobrado</span>
                            <span class="value" style="font-size: 13px;">R$ ${amount}</span>
                        </td>
                    </tr>
                </table>
                
                <div class="barcode-area">
                    <div style="width: 100%; border-top: 1px solid #000; margin: 10px 0;"></div>
                    <div class="barcode-mock"></div>
                    <div style="font-size: 8px; font-weight: bold; width: 100%; text-align: right;">AUTENTICAÇÃO MECÂNICA - FICHA DE COMPENSAÇÃO</div>
                </div>
            </div>
            
            <div style="height: 100px;"></div>
        </body>
        </html>
        `;
    }
}

export const salesService = new SalesService();
