import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { LocationCity, LocationImportJob, LocationLocality, LocationState } from './location.entity';
import { LocationsAdminController, LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationState, LocationCity, LocationLocality, LocationImportJob])],
  controllers: [LocationsController, LocationsAdminController],
  providers: [LocationsService, RolesGuard],
})
export class LocationsModule {}
