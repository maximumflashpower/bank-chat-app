import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('card_bin_config')
export class CardBinConfig extends BaseEntity {
  @Column({ name: 'bin_start', type: 'varchar', length: 6, nullable: false })
  binStart: string;

  @Column({ name: 'bin_end', type: 'varchar', length: 6, nullable: false })
  binEnd: string;

  @Column({ name: 'card_network', type: 'varchar', length: 20, nullable: false })
  cardNetwork: string;

  @Column({ name: 'country_code', type: 'varchar', length: 2, nullable: false })
  countryCode: string;

  @Column({ name: 'issuer_name', type: 'varchar', length: 255, nullable: false })
  issuerName: string;

  @Column({ name: 'card_category', type: 'varchar', length: 50, nullable: false })
  cardCategory: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
