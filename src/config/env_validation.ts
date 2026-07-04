import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  APP_PORT: Joi.number().default(3000),
  APP_PREFIX: Joi.string().default('api'),
  APP_NAME: Joi.string().default('bank-chat-app'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),
  DB_SYNC: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(true),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  TWILIO_ACCOUNT_SID: Joi.string().allow('').optional(),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').optional(),
  TWILIO_PHONE_NUMBER: Joi.string().allow('').optional(),
  OTP_TTL_SECONDS: Joi.number().default(300),
  OTP_LENGTH: Joi.number().default(6),

  BCRYPT_ROUNDS: Joi.number().default(12),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(10),

  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
});
