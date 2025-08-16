import { Module } from '@nestjs/common';
import { ResponseFormatterService } from './response-formatter.service';

@Module({
	providers: [ResponseFormatterService],
	exports: [ResponseFormatterService]
})
export class ResponseFormatterModule { }