// src/modules/loans/controllers/product.controller.ts

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from '../services/product.service.js';

@Controller('v1/loans/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query('active') active?: string) {
    return this.productService.findAll(active === 'false' ? false : true);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Get('type/:loanType')
  async findByType(@Param('loanType') loanType: string, @Query('interestType') interestType?: string) {
    return this.productService.findByType(loanType, interestType);
  }
}
