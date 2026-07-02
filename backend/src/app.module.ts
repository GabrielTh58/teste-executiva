import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { TemplateModule } from './modules/template/template.module';
import { HistoryModule } from './modules/history/history.module';
import { ContractModule } from './modules/contract/contract.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TenantModule,
    AuthModule,
    TemplateModule,
    HistoryModule,
    ContractModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
