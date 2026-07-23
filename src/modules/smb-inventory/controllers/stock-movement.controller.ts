import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StockMovementService } from '../services/stock-movement.service';
import { ReceiveGoodsDto } from '../dto/receive-goods.dto';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';

@Controller('smb-inventory/movements')
export class StockMovementController {
  constructor(private readonly movementService: StockMovementService) {}

  @Post('receive')
  async receiveGoods(@Body() dto: ReceiveGoodsDto) {
    return this.movementService.receiveGoods(dto);
  }

  @Post('transfer')
  async transfer(@Body() dto: CreateTransferDto) {
    return this.movementService.transfer(dto);
  }

  @Post('sale')
  async sale(
    @Body() body: { itemId: string; warehouseId: string; quantity: number; reference?: string },
  ) {
    return this.movementService.sale(
      body.itemId,
      body.warehouseId,
      body.quantity,
      body.reference,
    );
  }

  @Post('return')
  async returnGoods(
    @Body() body: { itemId: string; warehouseId: string; quantity: number; unitCost?: number; reference?: string },
  ) {
    return this.movementService.returnGoods(
      body.itemId,
      body.warehouseId,
      body.quantity,
      body.unitCost,
      body.reference,
    );
  }

  @Post('adjust')
  async adjust(@Body() dto: AdjustInventoryDto) {
    return this.movementService.adjust(dto);
  }

  @Get()
  async findMovements(
    @Query('itemId') itemId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('movementType') movementType?: string,
  ) {
    return this.movementService.findMovements({
      itemId,
      warehouseId,
      movementType,
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.movementService.findById(id);
  }
}
