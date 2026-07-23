import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { P2pService } from '../services/p2p.service';
import { AuthGuard } from '@nestjs/passport';

interface SendP2PDto {
  recipientIdentifier: string;
  amount: number;
  senderNote?: string;
}

@Controller('v1/mobile/p2p')
@UseGuards(AuthGuard('jwt'))
export class MobileP2pController {
  constructor(private readonly p2pService: P2pService) {}

  @Post('/send')
  async sendP2P(@Body() dto: SendP2PDto) {
    const senderId = 'sender-from-jwt';
    const senderAccountId = 'account-from-jwt';
    return this.p2pService.sendP2P({
      senderId,
      senderAccountId,
      ...dto,
    });
  }

  @Post('/:id/claim')
  async claimTransfer(@Param('id') id: string) {
    const recipientUserId = 'user-from-jwt';
    return this.p2pService.claimTransfer(id, recipientUserId);
  }

  @Post('/:id/return')
  async returnTransfer(@Param('id') id: string) {
    const senderId = 'sender-from-jwt';
    return this.p2pService.returnTransfer(id, senderId);
  }

  @Get('/contacts')
  async getContacts() {
    // Stub - implementar contacto real de usuario
    return [];
  }

  @Post('/:id/invite')
  async inviteContact(@Param('id') id: string, @Body('phoneNumber') phoneNumber: string) {
    return this.p2pService.inviteContact(id, phoneNumber);
  }

  @Get('/pending')
  async getPendingTransfers() {
    const senderId = 'sender-from-jwt';
    return this.p2pService.getPendingTransfers(senderId);
  }
}
