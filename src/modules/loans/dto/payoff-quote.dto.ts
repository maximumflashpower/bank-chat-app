import { IsNumber, IsDate, IsOptional } from 'class-validator';

export class PayoffQuoteDto {
  @IsDate()
  @IsOptional()
  asOfDate?: Date;

  @IsNumber()
  @IsOptional()
  prepaidPrincipal?: number;
}

export class PayoffQuoteResponse {
  loanId: string;
  quoteValidUntil: Date;
  outstandingPrincipal: number;
  accruedInterest: number;
  prepaymentPenalty?: number;
  totalPayoffAmount: number;
  dailyInterestAccrual: number;
}
