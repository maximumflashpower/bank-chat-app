import { IsString, IsObject } from 'class-validator';

export class TriggerWebhookDto {
  @IsString()
  eventType: string;

  @IsObject()
  payload: Record<string, unknown>;
}
