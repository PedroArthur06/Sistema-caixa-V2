import { Module, Global } from '@nestjs/common';
import { DateProvider } from './providers/date-provider.service';

@Global()
@Module({
  providers: [DateProvider],
  exports: [DateProvider],
})
export class SharedModule {}
