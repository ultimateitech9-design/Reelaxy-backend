import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Indian states/UTs for the public location pages (/video-chat/<state>). */
@Entity('location_states')
export class LocationState {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar', length: 120 }) name: string;
  @Index('UQ_location_states_slug', { unique: true })
  @Column({ type: 'varchar', length: 140 }) slug: string;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', unsigned: true, default: 0 }) cityCount: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) localityCount: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

/** Cities, unique by slug within a state (/video-chat/<state>/<city>). */
@Entity('location_cities')
@Index('UQ_location_cities_state_slug', ['stateId', 'slug'], { unique: true })
export class LocationCity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) stateId: number;
  @Column({ type: 'varchar', length: 160 }) name: string;
  @Column({ type: 'varchar', length: 180 }) slug: string;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', unsigned: true, default: 0 }) localityCount: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

/**
 * Localities, unique by slug within a city (/video-chat/<state>/<city>/<locality>).
 * The same locality name can exist in many cities; each gets its own page.
 */
@Entity('location_localities')
@Index('UQ_location_localities_city_slug', ['cityId', 'slug'], { unique: true })
@Index('IDX_location_localities_state', ['stateId'])
export class LocationLocality {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) cityId: number;
  @Column({ type: 'int' }) stateId: number;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 220 }) slug: string;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

export type LocationImportStatus = 'running' | 'completed' | 'failed';

/** One CSV upload from the super-admin panel (rows arrive in chunks). */
@Entity('location_import_jobs')
export class LocationImportJob {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar', length: 200 }) fileName: string;
  @Column({ type: 'varchar', length: 10 }) mode: 'merge' | 'replace';
  @Column({ type: 'varchar', length: 12, default: 'running' }) status: LocationImportStatus;
  @Column({ type: 'int', unsigned: true, default: 0 }) totalRows: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) processedRows: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) skippedRows: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) newStates: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) newCities: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) newLocalities: number;
  @Column({ type: 'varchar', length: 300, nullable: true }) error: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) createdBy: string | null;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'datetime', nullable: true }) finishedAt: Date | null;
}
