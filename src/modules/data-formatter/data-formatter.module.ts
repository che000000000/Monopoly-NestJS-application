import { Module } from '@nestjs/common';
import { DataFormatterService } from './data-formatter.service';

@Module({
	providers: [DataFormatterService],
	exports: [DataFormatterService]
})
export class DataFormatterModule { }