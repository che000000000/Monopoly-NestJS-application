import { Module } from '@nestjs/common';
import { MonopoliesService } from './monopolies.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Monopoly } from './model/monopoly';

@Module({
    imports: [SequelizeModule.forFeature([Monopoly])],
    providers: [MonopoliesService],
    exports: [MonopoliesService]
})

export class MonopoliesModule { }