import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyRedemptionCatalog, CatalogStatus, RedemptionType } from '../entities/loyalty-redemption-catalog.entity';
import { LoyaltyPointTransaction, PointTransactionType } from '../entities/loyalty-point-transaction.entity';
import { CustomerLoyaltyEnrollment } from '../entities/customer-loyalty-enrollment.entity';
import { RedeemDto } from '../dto/redeem.dto';

@Injectable()
export class RedemptionService {
  constructor(
    @InjectRepository(LoyaltyRedemptionCatalog)
    private catalogRepo: Repository<LoyaltyRedemptionCatalog>,
    @InjectRepository(LoyaltyPointTransaction)
    private transactionRepo: Repository<LoyaltyPointTransaction>,
    @InjectRepository(CustomerLoyaltyEnrollment)
    private enrollmentRepo: Repository<CustomerLoyaltyEnrollment>,
  ) {}

  async getCatalog(programId?: string, redemptionType?: RedemptionType): Promise<LoyaltyRedemptionCatalog[]> {
    const conditions: any = { status: CatalogStatus.ACTIVE };
    if (programId) conditions.programId = programId;
    if (redemptionType) conditions.redemptionType = redemptionType;
    return this.catalogRepo.find({
      where: Object.keys(conditions).length > 0 ? conditions : undefined,
      order: { sortOrder: 'ASC' },
    });
  }

  async findById(id: string): Promise<LoyaltyRedemptionCatalog> {
    const item = await this.catalogRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Catalog item not found');
    return item;
  }

  async redeem(dto: RedeemDto): Promise<{
    transactionId: string;
    pointsUsed: number;
    cashValue: number;
    redemptionType: string;
  }> {
    const catalogItem = await this.findById(dto.catalogItemId);
    
    if (catalogItem.status !== CatalogStatus.ACTIVE) {
      throw new BadRequestException('Item no disponible');
    }

    if (catalogItem.stockQuantity !== null && catalogItem.stockQuantity <= 0) {
      throw new BadRequestException('Agotado');
    }

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: dto.enrollmentId },
    });
    if (!enrollment) throw new BadRequestException('Enrollment not found');

    if (Number(enrollment.availablePointsBalance) < catalogItem.pointsRequired) {
      throw new BadRequestException('Puntos insuficientes');
    }

    // Procesar canje
    const transaction = this.transactionRepo.create({
      enrollmentId: dto.enrollmentId,
      programId: catalogItem.programId,
      customerId: enrollment.customerId,
      pointTransactionType: PointTransactionType.REDEEM,
      pointsRedeemed: catalogItem.pointsRequired,
      netPoints: -catalogItem.pointsRequired,
      redemptionReferenceId: dto.referenceId || null,
      description: `Canje: ${catalogItem.rewardName}`,
    });

    await this.transactionRepo.save(transaction);

    // Actualizar balance de puntos
    enrollment.availablePointsBalance = Number(enrollment.availablePointsBalance) - catalogItem.pointsRequired;
    enrollment.totalPointsRedeemedLifetime = Number(enrollment.totalPointsRedeemedLifetime) + catalogItem.pointsRequired;
    await this.enrollmentRepo.save(enrollment);

    // Actualizar contador de redemptions del catálogo
    catalogItem.totalRedemptionsAllTime += 1;
    catalogItem.redemptionsToday += 1;
    if (catalogItem.stockQuantity !== null && catalogItem.stockQuantity > 0) {
      catalogItem.stockQuantity -= 1;
    }
    await this.catalogRepo.save(catalogItem);

    return {
      transactionId: transaction.id,
      pointsUsed: catalogItem.pointsRequired,
      cashValue: catalogItem.cashValue,
      redemptionType: catalogItem.redemptionType,
    };
  }

  async redeemCashback(dto: {
    enrollmentId: string;
    customerId: string;
    programId: string;
    points: number;
    accountId: string;
  }): Promise<{ transactionId: string; pointsUsed: number; cashValue: number }> {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: dto.enrollmentId } });
    if (!enrollment) throw new BadRequestException('Enrollment not found');

    if (Number(enrollment.availablePointsBalance) < dto.points) {
      throw new BadRequestException('Puntos insuficientes');
    }

    // Placeholder: aquí iría la integración con el ledger para convertir puntos a saldo
    const transaction = this.transactionRepo.create({
      enrollmentId: dto.enrollmentId,
      programId: dto.programId,
      customerId: dto.customerId,
      pointTransactionType: PointTransactionType.REDEEM,
      pointsRedeemed: dto.points,
      netPoints: -dto.points,
      description: 'Canje a saldo cuenta',
    });

    await this.transactionRepo.save(transaction);

    enrollment.availablePointsBalance = Number(enrollment.availablePointsBalance) - dto.points;
    enrollment.totalPointsRedeemedLifetime = Number(enrollment.totalPointsRedeemedLifetime) + dto.points;
    await this.enrollmentRepo.save(enrollment);

    return {
      transactionId: transaction.id,
      pointsUsed: dto.points,
      cashValue: dto.points * 0.01, // Ejemplo: 100 puntos = $1
    };
  }
}
